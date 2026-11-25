"use server";

import { revalidatePath } from "next/cache";

import { currentRole, currentUserId } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { assertSellerOwns } from "./ownership";

/**
 * Seller-owned product writes.
 *
 * A seller creates, edits and archives only rows whose `owner_user_id` is
 * their Clerk id. Admins may manage any row. Prices and image URLs are stored
 * as given by the console form; the storefront always re-reads them.
 */

export type ProductKind = "event" | "restaurant";
export type ProductValues = Record<string, string | number>;
export type SaveProductResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const TABLE: Record<ProductKind, string> = {
  event: "events",
  restaurant: "restaurants",
};

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function eventPatch(values: ProductValues) {
  return {
    title: String(values.title ?? ""),
    subtitle: String(values.subtitle ?? ""),
    description: String(values.description ?? ""),
    venue: String(values.venue ?? ""),
    neighbourhood: String(values.neighbourhood ?? ""),
    city: String(values.city ?? "Accra"),
    event_date: String(values.event_date ?? ""),
    start_time: String(values.start_time ?? ""),
    end_time: String(values.end_time ?? ""),
    price_from: Number(values.price_from ?? 0),
    capacity: Number(values.capacity ?? 0),
    image_src: String(values.image_src ?? ""),
    image_alt: String(values.image_alt ?? ""),
    categories: splitTags(String(values.categories ?? "")),
    trending: values.trending === 1 || values.trending === "1",
    live: values.live === 1 || values.live === "1",
    updated_at: new Date().toISOString(),
  };
}

function restaurantPatch(values: ProductValues) {
  return {
    name: String(values.name ?? ""),
    tagline: String(values.tagline ?? ""),
    cuisine: String(values.cuisine ?? ""),
    neighbourhood: String(values.neighbourhood ?? ""),
    delivery_fee: Number(values.delivery_fee ?? 0),
    eta_minutes: Number(values.eta_minutes ?? 0),
    distance_km: Number(values.distance_km ?? 0),
    image_src: String(values.image_src ?? ""),
    image_alt: String(values.image_alt ?? ""),
    updated_at: new Date().toISOString(),
  };
}

export async function saveProduct(
  kind: ProductKind,
  values: ProductValues,
): Promise<SaveProductResult> {
  const client = createAdminClient();
  if (!client) return { ok: false, error: "Database is not configured." };

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage products." };

  const role = await currentRole();
  const table = TABLE[kind];
  const id = values.id ? String(values.id) : "";

  if (id) {
    const { data: existing, error: readError } = await client
      .from(table)
      .select("owner_user_id")
      .eq("id", id)
      .maybeSingle();
    if (readError) return { ok: false, error: "That product could not be loaded." };
    if (!existing) return { ok: false, error: "That product no longer exists." };

    try {
      assertSellerOwns(existing.owner_user_id, userId, role);
    } catch {
      return { ok: false, error: "Not your product." };
    }

    const patch = kind === "event" ? eventPatch(values) : restaurantPatch(values);
    const { error } = await client.from(table).update(patch).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const now = new Date().toISOString();
    let createdId = "";

    if (kind === "event") {
      const base = {
        ...eventPatch(values),
        id: `evt-${crypto.randomUUID().slice(0, 8)}`,
        slug: String(values.slug ?? values.title ?? "event")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        going: 0,
        discount_percent: 0,
        created_at: now,
        owner_user_id: userId,
      };
      const { data, error } = await client.from("events").insert(base).select("id").single();
      if (error) return { ok: false, error: error.message };
      createdId = data.id;
    } else {
      const base = {
        ...restaurantPatch(values),
        id: `rst-${crypto.randomUUID().slice(0, 8)}`,
        slug: String(values.slug ?? values.name ?? "kitchen")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        rating: 0,
        rating_count: 0,
        discount_percent: 0,
        created_at: now,
        owner_user_id: userId,
      };
      const { data, error } = await client.from("restaurants").insert(base).select("id").single();
      if (error) return { ok: false, error: error.message };
      createdId = data.id;
    }
    revalidatePath("/events");
    revalidatePath("/food");
    revalidatePath("/search");
    revalidatePath("/dashboard/products");
    return { ok: true, id: createdId };
  }

  revalidatePath("/events");
  revalidatePath("/food");
  revalidatePath("/search");
  revalidatePath("/dashboard/products");
  return { ok: true, id };
}
