"use server";

import { revalidatePath } from "next/cache";

import { currentClerkIdentity, currentUserId } from "@/lib/auth/server";
import { destroyImage } from "@/lib/media/cloudinary";
import { isAllowedImageUrl, publicIdFromUrl } from "@/lib/media/url";
import { createTransferRecipient, listPaystackBanks } from "@/lib/payments/paystack";
import { startCommissionCheckout } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";

import { COVER_IMAGES, EVENT_COVERS } from "./covers";
import { businesses, incomingOrders, incomingTickets } from "./data/business";
import { events } from "./data/events";
import { restaurants, sizesFor, toppingsFor } from "./data/food";
import { getApprovedBusiness, getOwnedBusiness } from "./repository";
import type { Business, BusinessKind, BusinessStatus, Restaurant } from "./types";

/**
 * The business actions.
 *
 * Everything a kitchen owner or an event promoter does: apply, post what they
 * sell, set the price, put an offer on, and deal with the orders that come in.
 *
 * Two rules hold everywhere here:
 *
 *   1. Nothing is published until the platform has approved the application.
 *   2. Nothing is published unless the signed-in account owns it.
 *
 * The price is always the database's — a browser that asks for a different one
 * is ignored.
 */

export type BusinessResult<T> =
  | { ok: true; data: T; demo?: boolean }
  | { ok: false; error: string };

export type BusinessInput = {
  kind: BusinessKind;
  name: string;
  email: string;
  phone: string;
  neighbourhood: string;
  about: string;
};

const KIND_LABEL: Record<BusinessKind, string> = {
  restaurant: "a kitchen",
  events: "an events company",
  driver: "a driver",
};

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* -------------------------------------------------------------------------- */
/* Applying                                                                    */
/* -------------------------------------------------------------------------- */

/** Apply to run a kitchen, promote events, or drive for ScalDive. */
export async function applyForBusiness(
  input: BusinessInput,
): Promise<BusinessResult<{ id: string; status: BusinessStatus }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Tell us the name of the business." };
  if (!input.email.trim()) return { ok: false, error: "We need an email to reach you on." };

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to apply." };

  const client = createAdminClient();

  if (!client) {
    // The demo keeps the application in the fixture set, so the console shows
    // it the same way it will show the real row.
    const business: Business = {
      id: `biz_demo_${Date.now()}`,
      userId,
      kind: input.kind,
      name,
      email: input.email.trim(),
      phone: input.phone.trim(),
      neighbourhood: input.neighbourhood.trim(),
      about: input.about.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    businesses.push(business);

    // A kitchen needs a storefront row before its console is useful.
    if (input.kind === "restaurant") {
      const venue: Restaurant = {
        id: `rst_demo_${Date.now()}`,
        slug: `${slugify(name) || "kitchen"}-${Date.now().toString().slice(-4)}`,
        name,
        tagline: "",
        cuisine: "Ghanaian",
        neighbourhood: input.neighbourhood.trim(),
        rating: 0,
        ratingCount: 0,
        deliveryFee: 0,
        etaMinutes: 30,
        distanceKm: 0,
        image: COVER_IMAGES[0],
        ownerId: userId,
        businessId: business.id,
        menu: [],
      };
      restaurants.push(venue);
    }

    revalidatePath("/profile");
    revalidateConsole(input.kind);

    return { ok: true, data: { id: business.id, status: "pending" }, demo: true };
  }

  // One live application per kind: applying again while one is waiting only
  // slows the answer down.
  const { data: existing, error: existingError } = await client
    .from("businesses")
    .select("id, status")
    .eq("user_id", userId)
    .eq("kind", input.kind)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    return {
      ok: false,
      error:
        existing.status === "approved"
          ? `You already run ${KIND_LABEL[input.kind]}.`
          : "You already have an application under review.",
    };
  }

  const id = `biz_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

  const { error } = await client.from("businesses").insert({
    id,
    user_id: userId,
    kind: input.kind,
    name,
    email: input.email.trim(),
    phone: input.phone.trim(),
    neighbourhood: input.neighbourhood.trim(),
    about: input.about.trim(),
    status: "pending",
  });

  if (error) return { ok: false, error: "We could not send your application. Try again." };

  if (input.kind === "restaurant") {
    const { error: venueError } = await client.from("restaurants").insert({
      id: `rst_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
      slug: `${slugify(name) || "kitchen"}-${Date.now().toString().slice(-5)}`,
      name,
      tagline: "",
      cuisine: "Ghanaian",
      neighbourhood: input.neighbourhood.trim(),
      rating: 0,
      rating_count: 0,
      delivery_fee: 0,
      eta_minutes: 30,
      distance_km: 0,
      owner_user_id: userId,
      business_id: id,
      image_src: COVER_IMAGES[0].src,
      image_alt: COVER_IMAGES[0].alt,
    });

    if (venueError) {
      await client.from("businesses").delete().eq("id", id);
      return { ok: false, error: "We could not finish setting up your kitchen. Try again." };
    }
  }

  revalidatePath("/profile");
  revalidateConsole(input.kind, id);

  return { ok: true, data: { id, status: "pending" } };
}

/* -------------------------------------------------------------------------- */
/* The gate                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The approval gate.
 *
 * A business may only publish once the platform has approved its application.
 */
async function requireApproved(
  kind: BusinessKind,
  businessId?: string,
): Promise<{ userId: string; business: Business } | { error: string }> {
  const userId = await currentUserId();
  if (!userId) return { error: "Sign in to manage your business." };

  const business =
    businessId && (kind === "restaurant" || kind === "events")
      ? await getOwnedBusiness(businessId, kind)
      : await getApprovedBusiness(kind);

  if (!business) {
    return { error: "That business is not yours to manage." };
  }
  if (business.status !== "approved") {
    return {
      error: "Your application is not approved yet, so you cannot publish yet.",
    };
  }

  return { userId, business };
}

/* -------------------------------------------------------------------------- */
/* Kitchens                                                                    */
/* -------------------------------------------------------------------------- */

/** Post a dish on the kitchen's menu. */
export async function publishMenuItem(input: {
  restaurantId: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  imageSrc?: string;
  imageAlt?: string;
}): Promise<BusinessResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Give the dish a name." };
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { ok: false, error: "Set a price for the dish." };
  }

  const gate = await requireApproved("restaurant", input.businessId);
  if ("error" in gate) return { ok: false, error: gate.error };

  if (input.imageSrc && !isAllowedImageUrl(input.imageSrc, gate.userId)) {
    return { ok: false, error: "That photograph is not yours to use." };
  }

  const image = {
    src: input.imageSrc ?? COVER_IMAGES[0].src,
    alt: input.imageAlt ?? COVER_IMAGES[0].alt,
  };

  const client = createAdminClient();
  if (!client) {
    const id = `mi_demo_${Date.now()}`;
    const price = Math.round(input.price);
    const kitchen = restaurants.find(
      (entry) => entry.id === input.restaurantId && entry.businessId === gate.business.id,
    );

    if (!kitchen) return { ok: false, error: "That kitchen is not yours to change." };

    kitchen.menu.push({
      id,
      name,
      description: input.description.trim(),
      tagline: "Made for you tonight",
      price,
      image,
      sizes: sizesFor(price),
      toppings: toppingsFor(kitchen.cuisine),
      popular: false,
      vegetarian: false,
    });

    revalidateConsole("restaurant", gate.business.id);
    revalidatePath(`/food/${kitchen.slug}`);

    return { ok: true, data: { id }, demo: true };
  }

  const { data: kitchen, error: kitchenError } = await client
    .from("restaurants")
    .select("id, slug, owner_user_id, business_id")
    .eq("id", input.restaurantId)
    .maybeSingle();

  if (kitchenError) throw kitchenError;
  if (!kitchen) return { ok: false, error: "That kitchen is no longer here." };
  if (kitchen.owner_user_id !== gate.userId || kitchen.business_id !== gate.business.id) {
    return { ok: false, error: "That kitchen is not yours to change." };
  }

  const id = `mi_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const price = Math.round(input.price);

  const { error } = await client.from("menu_items").insert({
    id,
    restaurant_id: input.restaurantId,
    name,
    description: input.description.trim(),
    tagline: "Made for you tonight",
    price,
    image_src: image.src,
    image_alt: image.alt,
    popular: false,
    vegetarian: false,
  });

  if (error) {
    const uploaded = input.imageSrc ? publicIdFromUrl(input.imageSrc) : null;
    if (uploaded) await destroyImage(uploaded);
    return { ok: false, error: "We could not add that dish. Try again." };
  }

  // The dish comes with the two portions and the extras the kitchen offers.
  const { error: sizeError } = await client.from("menu_item_sizes").insert([
    { id: `${id}-regular`, menu_item_id: id, name: "Regular", price, position: 1 },
    { id: `${id}-large`, menu_item_id: id, name: "Large", price: Math.round(price * 1.3), position: 2 },
  ]);

  if (sizeError) return { ok: false, error: "We could not set that dish's portions." };

  revalidateConsole("restaurant", gate.business.id);
  revalidatePath(`/food/${kitchen.slug}`);

  return { ok: true, data: { id } };
}

/** Change the price of a dish. */
export async function setMenuItemPrice(input: {
  menuItemId: string;
  price: number;
}): Promise<BusinessResult<{ price: number }>> {
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { ok: false, error: "Set a price for the dish." };
  }

  const gate = await requireApproved("restaurant");
  if ("error" in gate) return { ok: false, error: gate.error };

  const client = createAdminClient();
  if (!client) {
    const price = Math.round(input.price);
    const kitchen = restaurants.find((entry) =>
      entry.menu.some((item) => item.id === input.menuItemId),
    );
    const item = kitchen?.menu.find((entry) => entry.id === input.menuItemId);

    if (item) {
      item.price = price;
      const regular = item.sizes.find((size) => size.id === "regular");
      if (regular) regular.price = price;
    }

    revalidateConsole("restaurant");
    revalidatePath("/food");

    return { ok: true, data: { price }, demo: true };
  }

  const { data: item, error: itemError } = await client
    .from("menu_items")
    .select("id, restaurant_id, restaurants!inner(owner_user_id)")
    .eq("id", input.menuItemId)
    .maybeSingle();

  if (itemError) throw itemError;
  if (!item) return { ok: false, error: "That dish is no longer on the menu." };

  const owner = (item.restaurants as unknown as { owner_user_id: string } | null)?.owner_user_id;
  if (owner !== gate.userId) {
    return { ok: false, error: "That dish is not yours to change." };
  }

  const price = Math.round(input.price);

  const { error } = await client
    .from("menu_items")
    .update({ price })
    .eq("id", input.menuItemId);

  if (error) return { ok: false, error: "We could not change that price." };

  const { error: sizeError } = await client
    .from("menu_item_sizes")
    .update({ price })
    .eq("id", `${input.menuItemId}-regular`);

  if (sizeError) return { ok: false, error: "We could not change that price." };

  revalidateConsole("restaurant");

  return { ok: true, data: { price } };
}

/** Put the kitchen's weekly offer on, or take it off. */
export async function setRestaurantDiscount(input: {
  restaurantId: string;
  percent: number;
}): Promise<BusinessResult<{ percent: number }>> {
  const percent = Math.round(input.percent);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { ok: false, error: "An offer runs between 0 and 100 percent." };
  }

  const gate = await requireApproved("restaurant");
  if ("error" in gate) return { ok: false, error: gate.error };

  const client = createAdminClient();
  if (!client) {
    const kitchen = restaurants.find((entry) => entry.id === input.restaurantId);

    if (kitchen) {
      kitchen.discount = percent > 0 ? { label: `${percent}% off`, percent } : undefined;
    }

    revalidateConsole("restaurant");
    revalidatePath("/food");

    return { ok: true, data: { percent }, demo: true };
  }

  const { data: kitchen, error: kitchenError } = await client
    .from("restaurants")
    .select("id, owner_user_id")
    .eq("id", input.restaurantId)
    .maybeSingle();

  if (kitchenError) throw kitchenError;
  if (!kitchen) return { ok: false, error: "That kitchen is no longer here." };
  if (kitchen.owner_user_id !== gate.userId) {
    return { ok: false, error: "That kitchen is not yours to change." };
  }

  const { error } = await client
    .from("restaurants")
    .update({ discount_percent: percent })
    .eq("id", input.restaurantId);

  if (error) return { ok: false, error: "We could not set that offer." };

  revalidateConsole("restaurant");
  revalidatePath("/food");

  return { ok: true, data: { percent } };
}

/* -------------------------------------------------------------------------- */
/* Events                                                                      */
/* -------------------------------------------------------------------------- */

/** Post an event with its first ticket tier. */
export async function publishEvent(input: {
  businessId: string;
  title: string;
  venue: string;
  neighbourhood: string;
  date: string;
  startTime: string;
  endTime: string;
  tierName: string;
  price: number;
  capacity: number;
  imageSrc?: string;
  imageAlt?: string;
} & DiscountInput): Promise<BusinessResult<{ id: string; slug: string }>> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Give the event a name." };
  if (!input.venue.trim()) return { ok: false, error: "Where is it happening?" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { ok: false, error: "Pick the date." };
  }
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { ok: false, error: "Set a price for the tickets." };
  }

  const discount = cleanDiscount(input);
  if ("error" in discount) return { ok: false, error: discount.error };

  const gate = await requireApproved("events", input.businessId);
  if ("error" in gate) return { ok: false, error: gate.error };

  if (input.imageSrc && !isAllowedImageUrl(input.imageSrc, gate.userId)) {
    return { ok: false, error: "That poster is not yours to use." };
  }

  const image = {
    src: input.imageSrc ?? EVENT_COVERS[0].src,
    alt: input.imageAlt ?? EVENT_COVERS[0].alt,
  };

  const client = createAdminClient();
  if (!client) {
    const id = `evt_demo_${Date.now()}`;
    const slug = slugify(title);
    const price = Math.round(input.price);

    events.push({
      id,
      slug,
      title,
      subtitle: "New on ScalDive",
      description: title,
      venue: input.venue.trim(),
      neighbourhood: input.neighbourhood.trim(),
      city: "Accra",
      distanceKm: 0,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      image,
      categories: ["Live Show"],
      featured: false,
      trending: false,
      live: false,
      priceFrom: price,
      going: 0,
      capacity: Math.max(0, Math.round(input.capacity)),
      ownerId: gate.userId,
      businessId: gate.business.id,
      tiers: [
        {
          id: `${id}-ga`,
          name: input.tierName.trim() || "General Admission",
          description: "",
          price,
          perks: [],
          available: Math.max(0, Math.round(input.capacity)),
          discountPercent: discount.percent,
          discountStartsAt: discount.starts ?? undefined,
          discountEndsAt: discount.ends ?? undefined,
        },
      ],
    });

    revalidateConsole("events", gate.business.id);
    revalidatePath("/events");

    return { ok: true, data: { id, slug }, demo: true };
  }

  const slug = `${slugify(title)}-${Date.now().toString().slice(-5)}`;

  const eventId = `evt_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const tierId = `tier_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const price = Math.round(input.price);

  const { error } = await client.from("events").insert({
    id: eventId,
    slug,
    title,
    subtitle: "New on ScalDive",
    description: input.title.trim(),
    venue: input.venue.trim(),
    neighbourhood: input.neighbourhood.trim(),
    city: "Accra",
    distance_km: 0,
    event_date: input.date,
    start_time: input.startTime,
    end_time: input.endTime,
    image_src: image.src,
    image_alt: image.alt,
    categories: ["Live Show"],
    featured: false,
    trending: false,
    live: false,
    price_from: price,
    going: 0,
    capacity: Math.max(0, Math.round(input.capacity)),
    owner_user_id: gate.userId,
    business_id: gate.business.id,
    discount_percent: 0,
  });

  if (error) {
    const uploaded = input.imageSrc ? publicIdFromUrl(input.imageSrc) : null;
    if (uploaded) await destroyImage(uploaded);
    return { ok: false, error: "We could not publish that event. Try again." };
  }

  const { error: tierError } = await client.from("event_tiers").insert({
    id: tierId,
    event_id: eventId,
    name: input.tierName.trim() || "General Admission",
    description: "",
    price,
    perks: [],
    available: Math.max(0, Math.round(input.capacity)),
    ...discountColumns(discount),
  });

  if (tierError) return { ok: false, error: "We could not set that event's tickets." };

  revalidateConsole("events", gate.business.id);
  revalidatePath("/events");

  return { ok: true, data: { id: eventId, slug } };
}

/** Change the price of a ticket tier. */
export async function setTierPrice(input: {
  tierId: string;
  price: number;
}): Promise<BusinessResult<{ price: number }>> {
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { ok: false, error: "Set a price for the tickets." };
  }

  const gate = await requireApproved("events");
  if ("error" in gate) return { ok: false, error: gate.error };

  const client = createAdminClient();
  if (!client) {
    const price = Math.round(input.price);
    const tier = events.flatMap((event) => event.tiers).find((entry) => entry.id === input.tierId);

    if (tier) tier.price = price;

    revalidateConsole("events");
    revalidatePath("/events");

    return { ok: true, data: { price }, demo: true };
  }

  const { data: tier, error: tierError } = await client
    .from("event_tiers")
    .select("id, event_id, events!inner(owner_user_id)")
    .eq("id", input.tierId)
    .maybeSingle();

  if (tierError) throw tierError;
  if (!tier) return { ok: false, error: "That ticket is no longer on sale." };

  const owner = (tier.events as unknown as { owner_user_id: string } | null)?.owner_user_id;
  if (owner !== gate.userId) {
    return { ok: false, error: "That ticket is not yours to change." };
  }

  const price = Math.round(input.price);

  const { error } = await client
    .from("event_tiers")
    .update({ price })
    .eq("id", input.tierId);

  if (error) return { ok: false, error: "We could not change that price." };

  const { error: eventError } = await client
    .from("events")
    .update({ price_from: price })
    .eq("id", tier.event_id);

  if (eventError) return { ok: false, error: "We could not change that price." };

  revalidateConsole("events");

  return { ok: true, data: { price } };
}

/** Put the promoter's offer on, or take it off. */
export async function setEventDiscount(input: {
  eventId: string;
  percent: number;
}): Promise<BusinessResult<{ percent: number }>> {
  const percent = Math.round(input.percent);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { ok: false, error: "An offer runs between 0 and 100 percent." };
  }

  const gate = await requireApproved("events");
  if ("error" in gate) return { ok: false, error: gate.error };

  const client = createAdminClient();
  if (!client) {
    const event = events.find((entry) => entry.id === input.eventId);

    if (event) {
      event.discount = percent > 0 ? { label: `${percent}% off`, percent } : undefined;
    }

    revalidateConsole("events");
    revalidatePath("/events");

    return { ok: true, data: { percent }, demo: true };
  }

  const { data: event, error: eventError } = await client
    .from("events")
    .select("id, owner_user_id")
    .eq("id", input.eventId)
    .maybeSingle();

  if (eventError) throw eventError;
  if (!event) return { ok: false, error: "That event is no longer here." };
  if (event.owner_user_id !== gate.userId) {
    return { ok: false, error: "That event is not yours to change." };
  }

  const { error } = await client
    .from("events")
    .update({ discount_percent: percent })
    .eq("id", input.eventId);

  if (error) return { ok: false, error: "We could not set that offer." };

  revalidateConsole("events");
  revalidatePath("/events");

  return { ok: true, data: { percent } };
}

/* -------------------------------------------------------------------------- */
/* The orders that come in                                                     */
/* -------------------------------------------------------------------------- */

/** Accept an order: the kitchen has it now. */
export async function confirmOrder(input: {
  orderId: string;
}): Promise<BusinessResult<{ status: string }>> {
  const gate = await requireApproved("restaurant");
  if ("error" in gate) return { ok: false, error: gate.error };

  const client = createAdminClient();
  if (!client) {
    const order = incomingOrders.find((entry) => entry.id === input.orderId);

    if (order) order.status = "preparing";

    revalidateConsole("restaurant");

    return { ok: true, data: { status: "preparing" }, demo: true };
  }

  const { data: order, error: orderError } = await client
    .from("orders")
    .select("id, status, restaurant_id")
    .eq("id", input.orderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) return { ok: false, error: "That order is no longer here." };

  const kitchen = await ownedKitchen(client, order.restaurant_id, gate.userId);
  if (!kitchen) return { ok: false, error: "That order is not yours to accept." };

  const { error } = await client
    .from("orders")
    .update({ status: "preparing" })
    .eq("id", input.orderId);

  if (error) return { ok: false, error: "We could not accept that order." };

  revalidateConsole("restaurant");

  return { ok: true, data: { status: "preparing" } };
}

/** Close an order: it is done. */
export async function completeOrder(input: {
  orderId: string;
}): Promise<BusinessResult<{ status: string }>> {
  const gate = await requireApproved("restaurant");
  if ("error" in gate) return { ok: false, error: gate.error };

  const client = createAdminClient();
  if (!client) {
    const order = incomingOrders.find((entry) => entry.id === input.orderId);

    if (order) order.status = "delivered";

    revalidateConsole("restaurant");

    return { ok: true, data: { status: "delivered" }, demo: true };
  }

  const { data: order, error: orderError } = await client
    .from("orders")
    .select("id, status, restaurant_id")
    .eq("id", input.orderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) return { ok: false, error: "That order is no longer here." };

  const kitchen = await ownedKitchen(client, order.restaurant_id, gate.userId);
  if (!kitchen) return { ok: false, error: "That order is not yours to close." };

  const { error } = await client
    .from("orders")
    .update({ status: "delivered" })
    .eq("id", input.orderId);

  if (error) return { ok: false, error: "We could not close that order." };

  revalidateConsole("restaurant");

  return { ok: true, data: { status: "delivered" } };
}

/** Confirm a ticket: the customer is going. */
export async function confirmTicket(input: {
  ticketId: string;
}): Promise<BusinessResult<{ status: string }>> {
  const gate = await requireApproved("events");
  if ("error" in gate) return { ok: false, error: gate.error };

  const client = createAdminClient();
  if (!client) {
    const ticket = incomingTickets.find((entry) => entry.id === input.ticketId);

    if (ticket) ticket.status = "confirmed";

    revalidateConsole("events");

    return { ok: true, data: { status: "confirmed" }, demo: true };
  }

  const { data: ticket, error: ticketError } = await client
    .from("tickets")
    .select("id, status, event_id, events!inner(owner_user_id)")
    .eq("id", input.ticketId)
    .maybeSingle();

  if (ticketError) throw ticketError;
  if (!ticket) return { ok: false, error: "That ticket is no longer here." };

  const owner = (ticket.events as unknown as { owner_user_id: string } | null)?.owner_user_id;
  if (owner !== gate.userId) {
    return { ok: false, error: "That ticket is not yours to confirm." };
  }

  const { error } = await client
    .from("tickets")
    .update({ status: "confirmed" })
    .eq("id", input.ticketId);

  if (error) return { ok: false, error: "We could not confirm that ticket." };

  revalidateConsole("events");

  return { ok: true, data: { status: "confirmed" } };
}

/* -------------------------------------------------------------------------- */
/* Product management                                                          */
/* -------------------------------------------------------------------------- */

type DiscountInput = {
  discountPercent?: number;
  discountStartsAt?: string;
  discountEndsAt?: string;
};

function cleanDiscount(
  input: DiscountInput,
): { percent: number; starts: string | null; ends: string | null } | { error: string } {
  const percent = Math.round(input.discountPercent ?? 0);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { error: "The discount must be a whole number between 0 and 100." };
  }

  const starts = input.discountStartsAt || null;
  const ends = input.discountEndsAt || null;
  if (starts && ends && ends < starts) {
    return { error: "The expiry date must be after the start date." };
  }

  return { percent, starts, ends };
}

function parseTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 8);
}

function discountColumns(discount: { percent: number; starts: string | null; ends: string | null }) {
  return {
    discount_percent: discount.percent,
    discount_starts_at: discount.starts,
    discount_ends_at: discount.ends,
  };
}

/** Add a dish to one owned kitchen. */
export async function createMenuItem(input: {
  businessId: string;
  restaurantId: string;
  name: string;
  description: string;
  tags: string;
  price: number;
  imageSrc?: string;
  imageAlt?: string;
} & DiscountInput): Promise<BusinessResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Give the dish a name." };
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { ok: false, error: "Set a price for the dish." };
  }

  const discount = cleanDiscount(input);
  if ("error" in discount) return { ok: false, error: discount.error };

  const gate = await requireApproved("restaurant", input.businessId);
  if ("error" in gate) return { ok: false, error: gate.error };

  if (input.imageSrc && !isAllowedImageUrl(input.imageSrc, gate.userId)) {
    return { ok: false, error: "That photograph is not yours to use." };
  }

  const image = {
    src: input.imageSrc ?? COVER_IMAGES[0].src,
    alt: input.imageAlt ?? COVER_IMAGES[0].alt,
  };
  const price = Math.round(input.price);
  const tags = parseTags(input.tags);
  const client = createAdminClient();

  if (!client) {
    const kitchen = restaurants.find(
      (entry) => entry.id === input.restaurantId && entry.businessId === gate.business.id,
    );
    if (!kitchen) return { ok: false, error: "That kitchen is not yours to change." };

    const id = `mi_demo_${Date.now()}`;
    kitchen.menu.push({
      id,
      name,
      description: input.description.trim(),
      tagline: "",
      price,
      image,
      tags,
      discountPercent: discount.percent,
      discountStartsAt: discount.starts ?? undefined,
      discountEndsAt: discount.ends ?? undefined,
      sizes: sizesFor(price),
      toppings: toppingsFor(kitchen.cuisine),
      popular: false,
      vegetarian: false,
    });

    revalidateConsole("restaurant", gate.business.id);
    revalidatePath(`/food/${kitchen.slug}`);
    return { ok: true, data: { id }, demo: true };
  }

  const { data: kitchen, error: kitchenError } = await client
    .from("restaurants")
    .select("id, slug, owner_user_id, business_id")
    .eq("id", input.restaurantId)
    .maybeSingle();

  if (kitchenError) throw kitchenError;
  if (!kitchen || kitchen.owner_user_id !== gate.userId || kitchen.business_id !== gate.business.id) {
    return { ok: false, error: "That kitchen is not yours to change." };
  }

  const id = `mi_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const { error } = await client.from("menu_items").insert({
    id,
    restaurant_id: input.restaurantId,
    name,
    description: input.description.trim(),
    tagline: "",
    price,
    image_src: image.src,
    image_alt: image.alt,
    popular: false,
    vegetarian: false,
    tags,
    ...discountColumns(discount),
  });

  if (error) {
    const uploaded = input.imageSrc ? publicIdFromUrl(input.imageSrc) : null;
    if (uploaded) await destroyImage(uploaded);
    return { ok: false, error: "We could not add that dish. Try again." };
  }

  const { error: sizeError } = await client.from("menu_item_sizes").insert([
    { id: `${id}-regular`, menu_item_id: id, name: "Regular", price, position: 1 },
    {
      id: `${id}-large`,
      menu_item_id: id,
      name: "Large",
      price: Math.round(price * 1.3),
      position: 2,
    },
  ]);

  if (sizeError) return { ok: false, error: "We could not set that dish's portions." };

  revalidateConsole("restaurant", gate.business.id);
  revalidatePath(`/food/${kitchen.slug}`);
  return { ok: true, data: { id } };
}

/** Edit every part of a dish, including its photograph and discount. */
export async function updateMenuItem(input: {
  businessId: string;
  menuItemId: string;
  name: string;
  description: string;
  tags: string;
  price: number;
  imageSrc?: string;
  imageAlt?: string;
} & DiscountInput): Promise<BusinessResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Give the dish a name." };
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { ok: false, error: "Set a price for the dish." };
  }

  const discount = cleanDiscount(input);
  if ("error" in discount) return { ok: false, error: discount.error };

  const gate = await requireApproved("restaurant", input.businessId);
  if ("error" in gate) return { ok: false, error: gate.error };

  if (input.imageSrc && !isAllowedImageUrl(input.imageSrc, gate.userId)) {
    return { ok: false, error: "That photograph is not yours to use." };
  }

  const price = Math.round(input.price);
  const tags = parseTags(input.tags);
  const client = createAdminClient();

  if (!client) {
    const kitchen = restaurants.find(
      (entry) =>
        entry.businessId === gate.business.id &&
        entry.menu.some((item) => item.id === input.menuItemId),
    );
    const item = kitchen?.menu.find((entry) => entry.id === input.menuItemId);
    if (!kitchen || !item) return { ok: false, error: "That dish is not yours to change." };

    item.name = name;
    item.description = input.description.trim();
    item.price = price;
    item.tags = tags;
    item.discountPercent = discount.percent;
    item.discountStartsAt = discount.starts ?? undefined;
    item.discountEndsAt = discount.ends ?? undefined;
    if (input.imageSrc) item.image = {
      src: input.imageSrc,
      alt: input.imageAlt ?? item.image.alt,
    };
    item.sizes = item.sizes.map((size, index) => ({
      ...size,
      price: index === 0 ? price : Math.round(price * 1.3),
    }));

    revalidateConsole("restaurant", gate.business.id);
    revalidatePath(`/food/${kitchen.slug}`);
    return { ok: true, data: { id: item.id }, demo: true };
  }

  const { data: item, error: itemError } = await client
    .from("menu_items")
    .select("id, image_src, restaurants!inner(owner_user_id, business_id, slug)")
    .eq("id", input.menuItemId)
    .maybeSingle();

  if (itemError) throw itemError;
  const owner = Array.isArray(item?.restaurants) ? item?.restaurants[0] : item?.restaurants;
  if (!owner || owner.owner_user_id !== gate.userId || owner.business_id !== gate.business.id) {
    return { ok: false, error: "That dish is not yours to change." };
  }

  const uploaded = input.imageSrc ? publicIdFromUrl(input.imageSrc) : null;
  const { error } = await client
    .from("menu_items")
    .update({
      name,
      description: input.description.trim(),
      price,
      image_src: input.imageSrc ?? item?.image_src ?? COVER_IMAGES[0].src,
      image_alt: input.imageAlt ?? COVER_IMAGES[0].alt,
      tags,
      ...discountColumns(discount),
    })
    .eq("id", input.menuItemId);

  if (error) {
    if (uploaded && uploaded !== publicIdFromUrl(item?.image_src ?? "")) await destroyImage(uploaded);
    return { ok: false, error: "We could not save that dish. Try again." };
  }

  await client
    .from("menu_item_sizes")
    .update({ price })
    .eq("menu_item_id", input.menuItemId)
    .eq("position", 1);
  await client
    .from("menu_item_sizes")
    .update({ price: Math.round(price * 1.3) })
    .eq("menu_item_id", input.menuItemId)
    .eq("position", 2);

  if (uploaded && uploaded !== publicIdFromUrl(item?.image_src ?? "")) {
    const old = publicIdFromUrl(item?.image_src ?? "");
    if (old) await destroyImage(old);
  }

  revalidateConsole("restaurant", gate.business.id);
  revalidatePath(`/food/${owner.slug}`);
  return { ok: true, data: { id: input.menuItemId } };
}

/** Remove a dish. Past order lines keep their name and lose the reference. */
export async function deleteMenuItem(input: {
  businessId: string;
  menuItemId: string;
}): Promise<BusinessResult<{ id: string }>> {
  const gate = await requireApproved("restaurant", input.businessId);
  if ("error" in gate) return { ok: false, error: gate.error };

  const client = createAdminClient();
  if (!client) {
    const kitchen = restaurants.find(
      (entry) =>
        entry.businessId === gate.business.id &&
        entry.menu.some((item) => item.id === input.menuItemId),
    );
    if (!kitchen) return { ok: false, error: "That dish is not yours to change." };
    kitchen.menu = kitchen.menu.filter((item) => item.id !== input.menuItemId);
    revalidateConsole("restaurant", gate.business.id);
    return { ok: true, data: { id: input.menuItemId }, demo: true };
  }

  const { data: item, error: itemError } = await client
    .from("menu_items")
    .select("id, restaurants!inner(owner_user_id, business_id)")
    .eq("id", input.menuItemId)
    .maybeSingle();

  if (itemError) throw itemError;
  const owner = Array.isArray(item?.restaurants) ? item?.restaurants[0] : item?.restaurants;
  if (!owner || owner.owner_user_id !== gate.userId || owner.business_id !== gate.business.id) {
    return { ok: false, error: "That dish is not yours to change." };
  }

  const { error } = await client.from("menu_items").delete().eq("id", input.menuItemId);
  if (error) return { ok: false, error: "We could not remove that dish. Try again." };

  revalidateConsole("restaurant", gate.business.id);
  return { ok: true, data: { id: input.menuItemId } };
}

/** Edit an event's public details. */
export async function updateEvent(input: {
  businessId: string;
  eventId: string;
  title: string;
  venue: string;
  neighbourhood: string;
  date: string;
  startTime: string;
  endTime: string;
  imageSrc?: string;
  imageAlt?: string;
}): Promise<BusinessResult<{ id: string }>> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Give the event a name." };
  if (!input.venue.trim()) return { ok: false, error: "Where is it happening?" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: "Pick the date." };

  const gate = await requireApproved("events", input.businessId);
  if ("error" in gate) return { ok: false, error: gate.error };

  if (input.imageSrc && !isAllowedImageUrl(input.imageSrc, gate.userId)) {
    return { ok: false, error: "That poster is not yours to use." };
  }

  const client = createAdminClient();
  if (!client) {
    const event = events.find(
      (entry) => entry.id === input.eventId && entry.businessId === gate.business.id,
    );
    if (!event) return { ok: false, error: "That event is not yours to change." };

    event.title = title;
    event.venue = input.venue.trim();
    event.neighbourhood = input.neighbourhood.trim();
    event.date = input.date;
    event.startTime = input.startTime;
    event.endTime = input.endTime;
    if (input.imageSrc) event.image = { src: input.imageSrc, alt: input.imageAlt ?? event.image.alt };

    revalidateConsole("events", gate.business.id);
    revalidatePath(`/events/${event.slug}`);
    return { ok: true, data: { id: event.id }, demo: true };
  }

  const { data: event, error: eventError } = await client
    .from("events")
    .select("id, slug, owner_user_id, business_id")
    .eq("id", input.eventId)
    .maybeSingle();

  if (eventError) throw eventError;
  if (!event || event.owner_user_id !== gate.userId || event.business_id !== gate.business.id) {
    return { ok: false, error: "That event is not yours to change." };
  }

  const { error } = await client
    .from("events")
    .update({
      title,
      venue: input.venue.trim(),
      neighbourhood: input.neighbourhood.trim(),
      event_date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      image_src: input.imageSrc ?? undefined,
      image_alt: input.imageAlt ?? undefined,
    })
    .eq("id", input.eventId);

  if (error) return { ok: false, error: "We could not save that event. Try again." };

  revalidateConsole("events", gate.business.id);
  revalidatePath(`/events/${event.slug}`);
  return { ok: true, data: { id: event.id } };
}

/** Take an event off the live list without losing its ticket history. */
export async function closeEvent(input: {
  businessId: string;
  eventId: string;
}): Promise<BusinessResult<{ id: string }>> {
  const gate = await requireApproved("events", input.businessId);
  if ("error" in gate) return { ok: false, error: gate.error };

  const client = createAdminClient();
  if (!client) {
    const event = events.find(
      (entry) => entry.id === input.eventId && entry.businessId === gate.business.id,
    );
    if (!event) return { ok: false, error: "That event is not yours to change." };
    event.live = false;
    event.featured = false;
    revalidateConsole("events", gate.business.id);
    return { ok: true, data: { id: event.id }, demo: true };
  }

  const { data: event, error: eventError } = await client
    .from("events")
    .select("id, owner_user_id, business_id")
    .eq("id", input.eventId)
    .maybeSingle();

  if (eventError) throw eventError;
  if (!event || event.owner_user_id !== gate.userId || event.business_id !== gate.business.id) {
    return { ok: false, error: "That event is not yours to change." };
  }

  const { error } = await client
    .from("events")
    .update({ live: false, featured: false })
    .eq("id", input.eventId);

  if (error) return { ok: false, error: "We could not close that event. Try again." };

  revalidateConsole("events", gate.business.id);
  return { ok: true, data: { id: event.id } };
}

/** Edit a ticket tier's price, room and discount. */
export async function updateTicketTier(input: {
  businessId: string;
  tierId: string;
  name: string;
  price: number;
  available: number;
  salesClosed?: boolean;
} & DiscountInput): Promise<BusinessResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Give the ticket a name." };
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { ok: false, error: "Set a price for the tickets." };
  }

  const discount = cleanDiscount(input);
  if ("error" in discount) return { ok: false, error: discount.error };

  const gate = await requireApproved("events", input.businessId);
  if ("error" in gate) return { ok: false, error: gate.error };

  const client = createAdminClient();
  if (!client) {
    const event = events.find(
      (entry) =>
        entry.businessId === gate.business.id &&
        entry.tiers.some((tier) => tier.id === input.tierId),
    );
    const tier = event?.tiers.find((entry) => entry.id === input.tierId);
    if (!event || !tier) return { ok: false, error: "That ticket is not yours to change." };

    tier.name = name;
    tier.price = Math.round(input.price);
    tier.available = Math.max(0, Math.round(input.available));
    tier.salesClosed = input.salesClosed ?? false;
    tier.discountPercent = discount.percent;
    tier.discountStartsAt = discount.starts ?? undefined;
    tier.discountEndsAt = discount.ends ?? undefined;

    revalidateConsole("events", gate.business.id);
    return { ok: true, data: { id: tier.id }, demo: true };
  }

  const { data: tier, error: tierError } = await client
    .from("event_tiers")
    .select("id, events!inner(owner_user_id, business_id)")
    .eq("id", input.tierId)
    .maybeSingle();

  if (tierError) throw tierError;
  const owner = Array.isArray(tier?.events) ? tier?.events[0] : tier?.events;
  if (!owner || owner.owner_user_id !== gate.userId || owner.business_id !== gate.business.id) {
    return { ok: false, error: "That ticket is not yours to change." };
  }

  const { error } = await client
    .from("event_tiers")
    .update({
      name,
      price: Math.round(input.price),
      available: Math.max(0, Math.round(input.available)),
      sales_closed: input.salesClosed ?? false,
      ...discountColumns(discount),
    })
    .eq("id", input.tierId);

  if (error) return { ok: false, error: "We could not save that ticket. Try again." };

  revalidateConsole("events", gate.business.id);
  return { ok: true, data: { id: input.tierId } };
}

/** Remove a ticket tier. Sold tickets keep their name and lose the reference. */
export async function deleteTicketTier(input: {
  businessId: string;
  tierId: string;
}): Promise<BusinessResult<{ id: string }>> {
  const gate = await requireApproved("events", input.businessId);
  if ("error" in gate) return { ok: false, error: gate.error };

  const client = createAdminClient();
  if (!client) {
    const event = events.find(
      (entry) =>
        entry.businessId === gate.business.id &&
        entry.tiers.some((tier) => tier.id === input.tierId),
    );
    if (!event) return { ok: false, error: "That ticket is not yours to change." };
    event.tiers = event.tiers.filter((tier) => tier.id !== input.tierId);
    revalidateConsole("events", gate.business.id);
    return { ok: true, data: { id: input.tierId }, demo: true };
  }

  const { data: tier, error: tierError } = await client
    .from("event_tiers")
    .select("id, events!inner(owner_user_id, business_id)")
    .eq("id", input.tierId)
    .maybeSingle();

  if (tierError) throw tierError;
  const owner = Array.isArray(tier?.events) ? tier?.events[0] : tier?.events;
  if (!owner || owner.owner_user_id !== gate.userId || owner.business_id !== gate.business.id) {
    return { ok: false, error: "That ticket is not yours to change." };
  }

  const { error } = await client.from("event_tiers").delete().eq("id", input.tierId);
  if (error) return { ok: false, error: "We could not remove that ticket. Try again." };

  revalidateConsole("events", gate.business.id);
  return { ok: true, data: { id: input.tierId } };
}

/* -------------------------------------------------------------------------- */
/* Settlement                                                                  */
/* -------------------------------------------------------------------------- */

/** The GHS banks and mobile-money providers Paystack can pay. */
export async function getSettlementBanks(): Promise<
  { banks: { code: string; name: string }[]; momo: { code: string; name: string }[] }
> {
  return listPaystackBanks();
}

/** Registers the account a business is paid through and verifies it. */
export async function saveSettlementDetails(input: {
  businessId: string;
  bankCode: string;
  accountNumber: string;
  type: "mobile_money" | "nuban";
  accountName: string;
}): Promise<BusinessResult<{ recipientCode: string }>> {
  const gate = await requireApproved("restaurant", input.businessId);
  const eventsGate = "error" in gate ? null : gate;

  // The same action serves kitchens and event planners.
  let owner = eventsGate;
  if (!owner) {
    const other = await requireApproved("events", input.businessId);
    if (!("error" in other)) owner = other;
  }
  if (!owner) return { ok: false, error: "You cannot change this business's payment details." };

  const code = input.bankCode.trim();
  const account = input.accountNumber.replace(/\D/g, "");
  if (!code || account.length < 9 || account.length > 15) {
    return { ok: false, error: "Choose a provider and enter a valid account number." };
  }

  const result = await createTransferRecipient({
    type: input.type,
    name: input.accountName.trim() || owner.business.name,
    accountNumber: account,
    bankCode: code,
  });

  if (!result.ok || !result.recipientCode) {
    return { ok: false, error: result.message || "We could not verify that account." };
  }

  const client = createAdminClient();
  if (!client) return { ok: true, data: { recipientCode: result.recipientCode }, demo: true };

  const { error } = await client
    .from("businesses")
    .update({
      settlement_bank: code,
      settlement_account: account.slice(-4),
      settlement_type: input.type,
      transfer_recipient_code: result.recipientCode,
      settlement_verified: true,
    })
    .eq("id", input.businessId);

  if (error) return { ok: false, error: "We could not save those payment details." };

  revalidateConsole(owner.business.kind, input.businessId);
  return { ok: true, data: { recipientCode: result.recipientCode } };
}

/* -------------------------------------------------------------------------- */
/* Sold-out requests and commission                                           */
/* -------------------------------------------------------------------------- */

/** Resolve a sold-out request from the planner's console. */
export async function decideTicketRequest(input: {
  requestId: string;
  status: "fulfilled" | "declined";
}): Promise<BusinessResult<{ status: string }>> {
  const gate = await requireApproved("events");
  if ("error" in gate) return { ok: false, error: gate.error };

  const client = createAdminClient();
  if (!client) return { ok: true, data: { status: input.status }, demo: true };

  const { data: request } = await client
    .from("ticket_requests")
    .select("id, events!inner(owner_user_id, business_id)")
    .eq("id", input.requestId)
    .maybeSingle();

  const owner = Array.isArray(request?.events) ? request?.events[0] : request?.events;
  if (!owner || owner.owner_user_id !== gate.userId) {
    return { ok: false, error: "That request is not yours to decide." };
  }

  const { error } = await client
    .from("ticket_requests")
    .update({ status: input.status, decided_at: new Date().toISOString() })
    .eq("id", input.requestId);

  if (error) return { ok: false, error: "We could not save that decision." };

  revalidateConsole("events", gate.business.id);
  return { ok: true, data: { status: input.status } };
}

/** Starts a Paystack charge for the commission owed by this planner. */
export async function payCommission(input: {
  paymentId: string;
  businessId: string;
}): Promise<BusinessResult<{ checkoutUrl: string | null }>> {
  const gate = await requireApproved("events", input.businessId);
  if ("error" in gate) return { ok: false, error: gate.error };

  const client = createAdminClient();
  if (!client) return { ok: false, error: "No database is connected." };

  const { data: charge } = await client
    .from("payments")
    .select("id, payer_user_id, status")
    .eq("id", input.paymentId)
    .maybeSingle();

  if (!charge || charge.payer_user_id !== gate.userId) {
    return { ok: false, error: "That charge does not belong to your business." };
  }
  if (charge.status === "success") {
    return { ok: false, error: "That commission is already settled." };
  }

  const identity = await currentClerkIdentity();
  const result = await startCommissionCheckout({
    paymentId: input.paymentId,
    email: identity?.email ?? "",
  });

  if (!result.ok) return { ok: false, error: result.error ?? "Payment could not start." };

  return { ok: true, data: { checkoutUrl: result.checkoutUrl } };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Refresh the console.
 *
 * The hub and the two consoles are separate routes, so a write refreshes the
 * hub and the console that owns the change - otherwise the manager would
 * press "Accept the order" and still see it waiting.
 */
function revalidateConsole(kind: BusinessKind, businessId?: string): void {
  const base = kind === "events" ? "/dashboard/events" : "/dashboard/restaurant";
  revalidatePath("/dashboard");
  revalidatePath(base);
  if (businessId) revalidatePath(`${base}/${businessId}`);
}

async function ownedKitchen(
  client: NonNullable<ReturnType<typeof createAdminClient>>,
  restaurantId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("restaurants")
    .select("owner_user_id")
    .eq("id", restaurantId)
    .maybeSingle();

  if (error) throw error;
  return data?.owner_user_id === userId;
}

