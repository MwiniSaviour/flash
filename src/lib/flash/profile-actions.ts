"use server";

import { revalidatePath } from "next/cache";

import { currentUserId } from "@/lib/auth/server";
import { ensureProfile } from "@/lib/flash/profile";
import { markPersistedRead } from "@/lib/notifications/inbox";
import { createAdminClient } from "@/lib/supabase/admin";

export type AccountResult = { ok: true } | { ok: false; error: string };

/** Edit the customer's own profile fields. */
export async function updateProfile(input: { name?: string; email?: string }): Promise<AccountResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage your profile." };

  const name = input.name?.trim();
  if (name !== undefined && !name) return { ok: false, error: "Give the profile a name." };
  if (input.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return { ok: false, error: "That email address is not valid." };
  }

  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured");

  await ensureProfile(client, userId);
  const updates: Record<string, string> = {};
  if (name !== undefined) updates.name = name;
  if (input.email !== undefined) updates.email = input.email.trim();
  if (Object.keys(updates).length) {
    const { error } = await client.from("profiles").update(updates).eq("id", userId);
    if (error) return { ok: false, error: "The profile could not be saved." };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return { ok: true };
}

/** Persist the customer's alert preference. */
export async function setNotificationsEnabled(enabled: boolean): Promise<AccountResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage notifications." };

  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured");

  await ensureProfile(client, userId);
  const { error } = await client
    .from("profiles")
    .update({ notifications_enabled: enabled })
    .eq("id", userId);

  if (error) return { ok: false, error: "The setting could not be saved." };
  revalidatePath("/profile");
  revalidatePath("/profile/notifications");
  return { ok: true };
}

/** Add a saved place, scoped to the signed-in customer. */
export async function addSavedPlace(input: { label: string; detail: string }): Promise<AccountResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage saved places." };

  const label = input.label.trim();
  const detail = input.detail.trim();
  if (!label) return { ok: false, error: "Give the place a name." };
  if (!detail) return { ok: false, error: "Add the address or landmark." };

  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured");

  const id = `pl_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const { error } = await client.from("saved_places").insert({
    user_id: userId,
    id,
    label,
    detail,
    position: Date.now(),
  });

  if (error) return { ok: false, error: "The place could not be saved." };
  revalidatePath("/profile/saved-places");
  revalidatePath("/ride");
  return { ok: true };
}

/** Rename or move a saved place. */
export async function updateSavedPlace(input: {
  id: string;
  label: string;
  detail: string;
}): Promise<AccountResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage saved places." };

  const label = input.label.trim();
  const detail = input.detail.trim();
  if (!label) return { ok: false, error: "Give the place a name." };
  if (!detail) return { ok: false, error: "Add the address or landmark." };

  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured");

  const { error } = await client
    .from("saved_places")
    .update({ label, detail })
    .eq("user_id", userId)
    .eq("id", input.id);

  if (error) return { ok: false, error: "The place could not be updated." };
  revalidatePath("/profile/saved-places");
  revalidatePath("/ride");
  return { ok: true };
}

/** Remove a saved place. */
export async function deleteSavedPlace(placeId: string): Promise<AccountResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage saved places." };

  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured");

  const { error } = await client
    .from("saved_places")
    .delete()
    .eq("user_id", userId)
    .eq("id", placeId);

  if (error) return { ok: false, error: "The place could not be removed." };
  revalidatePath("/profile/saved-places");
  revalidatePath("/ride");
  return { ok: true };
}

/** Mark inbox items as read. Keys come from the server-derived inbox. */
export async function markNotificationsRead(keys: string[]): Promise<AccountResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage notifications." };

  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured");

  const valid = keys.filter((key) => typeof key === "string" && key.length > 0 && key.length <= 200);
  const persisted = valid.filter((key) => key.startsWith("ntf:")).map((key) => key.slice(4));
  const derived = valid.filter((key) => !key.startsWith("ntf:"));
  if (!persisted.length && !derived.length) return { ok: true };

  if (persisted.length) await markPersistedRead(persisted);

  if (derived.length) {
    const { error } = await client.from("notification_reads").upsert(
      derived.map((key) => ({ user_id: userId, notification_key: key })),
      { onConflict: "user_id,notification_key", ignoreDuplicates: true },
    );
    if (error) return { ok: false, error: "The alerts could not be updated." };
  }

  revalidatePath("/profile/notifications");
  revalidatePath("/profile");
  return { ok: true };
}
