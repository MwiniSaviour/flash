"use server";

import { revalidatePath } from "next/cache";

import { currentClerkIdentity, currentUserId } from "@/lib/auth/server";
import { destroyImage } from "@/lib/media/cloudinary";
import { isOwnedCloudinaryUrl, publicIdFromUrl } from "@/lib/media/url";
import { paystackConfigured } from "@/lib/payments/paystack";
import { recordCashCommission, startCheckout } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";

import { findCover } from "./covers";
import { events } from "./data/events";
import { restaurants } from "./data/food";
import {
  parcelTrackingNumber,
  parcelTypes,
  quoteParcel,
  type ParcelSize,
} from "./data/parcels";
import { ensureProfile } from "./profile";
import { activeDiscountPercent, deliveryQuote, discountOn } from "./pricing";
import { isBusinessAccount } from "./repository";
import type { Fulfilment, MenuItem } from "./types";
/**
 * The writes.
 *
 * Every mutation in Flash goes through one of these actions, so there is a
 * single place where a customer can commit to something. The server checks the
 * price against the database — never against what the browser sent — and the
 * screens only ever see the reference that comes back.
 *
 * With Supabase connected the action writes a row. Without it, the action
 * answers from the demo fixtures and says so, which keeps the demo honest
 * instead of pretending something was saved.
 */

export type ActionResult<T> =
  | { ok: true; data: T; demo?: boolean }
  | { ok: false; error: string };

export type TicketBooking = {
  id: string;
  reference: string;
  total: number;
  demo: boolean;
  checkoutUrl?: string | null;
};

export type OrderPlaced = {
  id: string;
  reference: string;
  number: string;
  total: number;
  etaMinutes: number;
  demo: boolean;
  checkoutUrl?: string | null;
};

export type RideRequested = {
  id: string;
  reference: string;
  number: string;
  price: number;
  etaMinutes: number;
  demo: boolean;
};

export type ParcelSent = {
  id: string;
  trackingNumber: string;
  price: number;
  etaMinutes: number;
  demo: boolean;
};

/* -------------------------------------------------------------------------- */
/* Identifiers                                                                 */
/* -------------------------------------------------------------------------- */

function digits(length: number): string {
  return String(Math.floor(Math.random() * 10 ** length)).padStart(length, "0");
}

function mintId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function mintReference(): string {
  return `FLS-${digits(4)}-${digits(4)}`;
}

function mintNumber(): string {
  return digits(8);
}

function clampQuantity(quantity: number): number {
  return Math.min(6, Math.max(1, Math.floor(quantity) || 1));
}

/** The party size a ride can carry. */
function clampPassengers(passengers: number): number {
  return Math.min(6, Math.max(1, Math.floor(passengers) || 1));
}

/* -------------------------------------------------------------------------- */
/* Tickets                                                                     */
/* -------------------------------------------------------------------------- */

export async function bookTicket(input: {
  eventId: string;
  tierId: string;
  quantity: number;
  paymentMethod?: "online" | "cash";
}): Promise<ActionResult<TicketBooking>> {
  const quantity = clampQuantity(input.quantity);
  const client = createAdminClient();

  if (!client) {
    const event = events.find((entry) => entry.id === input.eventId);
    const tier = event?.tiers.find((entry) => entry.id === input.tierId);
    if (!tier) return { ok: false, error: "That ticket is no longer available." };

    return {
      ok: true,
      data: {
        id: mintId("tkt"),
        reference: mintReference(),
        total: tier.price * quantity,
        demo: true,
      },
    };
  }

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to book a ticket." };

  // Every row that carries a user_id needs the profile row to exist first.
  await ensureProfile(client, userId);

  const { data: tier, error: tierError } = await client
    .from("event_tiers")
    .select("id, name, price, event_id, available")
    .eq("id", input.tierId)
    .maybeSingle();

  if (tierError) throw tierError;
  if (!tier) return { ok: false, error: "That ticket is no longer available." };
  if (tier.available < quantity) {
    return { ok: false, error: `Only ${tier.available} ${tier.name} tickets are left.` };
  }

  const id = mintId("tkt");
  const reference = mintReference();

  // No payment provider is connected, so a new ticket is reserved — not paid.
  const { error } = await client.from("tickets").insert({
    id,
    user_id: userId,
    event_id: tier.event_id,
    tier_id: tier.id,
    tier_name: tier.name,
    quantity,
    status: "pending",
    reference,
    purchased_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: "We could not hold that ticket. Try again." };

  const total = tier.price * quantity;
  const identity = await currentClerkIdentity();

  if (paystackConfigured()) {
    if (input.paymentMethod === "cash") {
      await recordCashCommission({
        userId,
        itemsCedis: total,
        deliveryFeeCedis: 0,
        selfDelivery: false,
        ticketId: id,
      });
    } else {
      const checkout = await startCheckout({
        kind: "ticket",
        userId,
        email: identity?.email ?? "",
        itemsCedis: total,
        deliveryFeeCedis: 0,
        selfDelivery: false,
        ticketId: id,
      });
      return {
        ok: true,
        data: { id, reference, total, demo: false, checkoutUrl: checkout.checkoutUrl },
      };
    }
  }

  revalidatePath("/bookings");
  revalidatePath("/tickets");

  return {
    ok: true,
    data: { id, reference, total: tier.price * quantity, demo: false },
  };
}

/* -------------------------------------------------------------------------- */
/* Food                                                                        */
/* -------------------------------------------------------------------------- */

export async function placeOrder(input: {
  restaurantId: string;
  fulfilment: Fulfilment;
  address: string;
  paymentMethod?: "online" | "cash";
  lines: {
    menuItemId: string;
    size: string;
    toppings: string[];
    quantity: number;
  }[];
}): Promise<ActionResult<OrderPlaced>> {
  const fulfilment: Fulfilment =
    input.fulfilment === "pickup" || input.fulfilment === "dine_in"
      ? input.fulfilment
      : "delivery";

  const lines = input.lines
    .map((line) => ({
      menuItemId: line.menuItemId,
      size: line.size,
      toppings: line.toppings ?? [],
      quantity: clampQuantity(line.quantity),
    }))
    .filter((line) => line.quantity > 0);

  if (lines.length === 0) return { ok: false, error: "Your bag is empty." };
  if (fulfilment === "delivery" && !input.address.trim()) {
    return { ok: false, error: "Add a delivery address." };
  }

  const client = createAdminClient();

  if (client && (await isBusinessAccount())) {
    return {
      ok: false,
      error: "Business accounts do not order from their own kitchens. Order from a customer account.",
    };
  }

  if (!client) {
    const restaurant = restaurants.find((entry) => entry.id === input.restaurantId);
    if (!restaurant) return { ok: false, error: "That kitchen is no longer available." };

    const priced = lines.map((line) => {
      const item = restaurant.menu.find((entry) => entry.id === line.menuItemId);
      if (!item) return null;

      const size = item.sizes.find((entry) => entry.id === line.size) ?? item.sizes[0];
      const toppings = line.toppings
        .map((id) => item.toppings.find((topping) => topping.id === id))
        .filter((topping): topping is MenuItem["toppings"][number] => Boolean(topping));

      const listPrice =
        (size?.price ?? item.price) +
        toppings.reduce((total, topping) => total + topping.price, 0);
      const percent = activeDiscountPercent(item);

      return {
        name: item.name,
        size: size?.name ?? "",
        toppings: toppings.map((topping) => topping.name),
        price: listPrice - discountOn(listPrice, percent),
        discount: discountOn(listPrice, percent),
        quantity: line.quantity,
      };
    });

    if (priced.some((line) => line === null)) {
      return { ok: false, error: "One of those items is no longer on the menu." };
    }

    const subtotal = priced.reduce(
      (total, line) => total + (line!.price + line!.discount) * line!.quantity,
      0,
    );
    const discount = priced.reduce((total, line) => total + line!.discount * line!.quantity, 0);
    const deliveryFee = deliveryQuote(restaurant, fulfilment);

    return {
      ok: true,
      data: {
        id: mintId("ord"),
        reference: mintReference(),
        number: mintNumber(),
        total: subtotal - discount + deliveryFee,
        etaMinutes: restaurant.etaMinutes,
        demo: true,
      },
    };
  }

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to place an order." };

  await ensureProfile(client, userId);

  const { data: restaurant, error: restaurantError } = await client
    .from("restaurants")
    .select("id, name, delivery_fee, distance_km, eta_minutes, discount_percent")
    .eq("id", input.restaurantId)
    .maybeSingle();

  if (restaurantError) throw restaurantError;
  if (!restaurant) return { ok: false, error: "That kitchen is no longer available." };

  const ids = lines.map((line) => line.menuItemId);
  const { data: items, error: itemsError } = await client
    .from("menu_items")
    .select(
      "id, restaurant_id, name, price, discount_percent, discount_starts_at, discount_ends_at, menu_item_sizes(*), menu_item_toppings(*)",
    )
    .in("id", ids);

  if (itemsError) throw itemsError;

  // The price is the database's, never the browser's.
  const priced = lines.map((line) => {
    const item = (items ?? []).find((entry) => entry.id === line.menuItemId);
    if (!item) return null;

    const sizes = item.menu_item_sizes ?? [];
    const available = item.menu_item_toppings ?? [];
    const size = sizes.find((entry) => entry.id === line.size) ?? sizes[0];
    const extras = line.toppings
      .map((id) => available.find((topping) => topping.id === id))
      .filter((topping): topping is { id: string; name: string; price: number } =>
        Boolean(topping),
      );

    const listPrice =
      (size?.price ?? item.price) +
      extras.reduce((total, topping) => total + topping.price, 0);
    const percent = activeDiscountPercent({
      discountPercent: item.discount_percent ?? 0,
      discountStartsAt: item.discount_starts_at ?? undefined,
      discountEndsAt: item.discount_ends_at ?? undefined,
    });

    return {
      menu_item_id: item.id,
      name: item.name,
      size: size?.name ?? "",
      toppings: extras.map((topping) => topping.name),
      price: listPrice - discountOn(listPrice, percent),
      discount: discountOn(listPrice, percent),
      quantity: line.quantity,
    };
  });

  if (priced.some((line) => line === null)) {
    return { ok: false, error: "One of those items is no longer on the menu." };
  }

  const orderLines = priced.map((line) => ({
    id: mintId("ol"),
    menu_item_id: line!.menu_item_id,
    name: line!.name,
    size: line!.size,
    toppings: line!.toppings,
    quantity: line!.quantity,
    price: line!.price,
  }));

  const subtotal = priced.reduce(
    (total, line) => total + (line!.price + line!.discount) * line!.quantity,
    0,
  );

  const deliveryFee = deliveryQuote(
    { deliveryFee: restaurant.delivery_fee, distanceKm: restaurant.distance_km },
    fulfilment,
  );
  const discount = priced.reduce((total, line) => total + line!.discount * line!.quantity, 0);

  const id = mintId("ord");
  const reference = mintReference();
  const number = mintNumber();

  const { error } = await client.from("orders").insert({
    id,
    user_id: userId,
    restaurant_id: restaurant.id,
    rider_id: null,
    number,
    fulfilment,
    self_delivery: fulfilment !== "delivery",
    status: "preparing",
    subtotal,
    discount,
    delivery_fee: deliveryFee,
    address: fulfilment === "delivery" ? input.address.trim() : "",
    eta_minutes: restaurant.eta_minutes,
    reference,
    placed_at: new Date().toISOString(),
    order_lines: orderLines,
  });

  if (error) return { ok: false, error: "We could not place that order. Try again." };

  const total = subtotal - discount + deliveryFee;

  if (paystackConfigured()) {
    const selfDelivery = fulfilment !== "delivery";

    if (input.paymentMethod === "cash") {
      await recordCashCommission({
        userId,
        itemsCedis: subtotal - discount,
        deliveryFeeCedis: deliveryFee,
        selfDelivery,
        orderId: id,
      });
    } else {
      const identity = await currentClerkIdentity();
      const checkout = await startCheckout({
        kind: "order",
        userId,
        email: identity?.email ?? "",
        itemsCedis: subtotal - discount,
        deliveryFeeCedis: deliveryFee,
        selfDelivery,
        orderId: id,
      });
      return {
        ok: true,
        data: {
          id,
          reference,
          number,
          total,
          etaMinutes: restaurant.eta_minutes,
          demo: false,
          checkoutUrl: checkout.checkoutUrl,
        },
      };
    }
  }

  revalidatePath("/bookings");
  revalidatePath("/track");
  revalidatePath("/orders");

  return {
    ok: true,
    data: {
      id,
      reference,
      number,
      total,
      etaMinutes: restaurant.eta_minutes,
      demo: false,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Rides                                                                       */
/* -------------------------------------------------------------------------- */

export async function requestRide(input: {
  rideClass: string;
  passengers: number;
  pickup: string;
  dropoff: string;
}): Promise<ActionResult<RideRequested>> {
  if (!input.pickup.trim() || !input.dropoff.trim()) {
    return { ok: false, error: "Add a pick-up and a drop-off." };
  }

  const client = createAdminClient();

  if (!client) {
    const rideClass = ["flash-bike", "flash-go", "flash-comfort", "flash-xl"].includes(
      input.rideClass,
    )
      ? input.rideClass
      : "flash-go";

    return {
      ok: true,
      data: {
        id: mintId("ride"),
        reference: mintReference(),
        number: mintNumber(),
        price: rideClass === "flash-go" ? 28 : 0,
        etaMinutes: 12,
        demo: true,
      },
    };
  }

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to book a ride." };

  await ensureProfile(client, userId);

  const { data: rideClass, error: classError } = await client
    .from("ride_classes")
    .select("id, name, price, eta_minutes, seats")
    .eq("id", input.rideClass)
    .maybeSingle();

  if (classError) throw classError;
  if (!rideClass) return { ok: false, error: "That ride is no longer available." };

  // The party has to fit the ride. The browser is not asked to be trusted.
  const passengers = clampPassengers(input.passengers);

  if (passengers > rideClass.seats) {
    return {
      ok: false,
      error: `${rideClass.name} takes ${rideClass.seats}. Pick a bigger ride for ${passengers}.`,
    };
  }

  const id = mintId("ride");
  const reference = mintReference();
  const number = mintNumber();

  // Flash has no maps yet, so every route is still the demo distance.
  const { error } = await client.from("rides").insert({
    id,
    user_id: userId,
    rider_id: null,
    ride_class: rideClass.id,
    pickup: input.pickup.trim(),
    pickup_area: "",
    dropoff: input.dropoff.trim(),
    dropoff_area: "",
    distance_km: 3.8,
    duration_minutes: 14,
    eta_minutes: rideClass.eta_minutes,
    price: rideClass.price,
    passengers,
    status: "requested",
    number,
    reference,
    requested_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: "We could not book that ride. Try again." };

  revalidatePath("/bookings");
  revalidatePath("/track");
  revalidatePath("/rides");

  return {
    ok: true,
    data: {
      id,
      reference,
      number,
      price: rideClass.price,
      etaMinutes: rideClass.eta_minutes,
      demo: false,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* The storefront                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Change the kitchen's cover.
 *
 * The cover is the first thing a customer sees, so only the photographs in the
 * catalogue are allowed — and the alt text that describes the frame travels
 * with it.
 */
export async function updateCover(input: {
  restaurantId: string;
  imageSrc: string;
}): Promise<ActionResult<{ imageSrc: string }>> {
  const client = createAdminClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage your kitchen." };

  // A catalogue photograph, or a Cloudinary asset this account uploaded.
  const cover =
    findCover(input.imageSrc) ??
    (isOwnedCloudinaryUrl(input.imageSrc, userId)
      ? { src: input.imageSrc, alt: "The kitchen's own cover photograph" }
      : null);

  if (!cover) return { ok: false, error: "That photograph is not yours to use." };

  if (!client) {
    return { ok: true, data: { imageSrc: cover.src }, demo: true };
  }

  const { data: kitchen, error: kitchenError } = await client
    .from("restaurants")
    .select("id, owner_user_id, image_src")
    .eq("id", input.restaurantId)
    .maybeSingle();

  if (kitchenError) throw kitchenError;
  if (!kitchen) return { ok: false, error: "That kitchen is no longer here." };
  if (kitchen.owner_user_id !== userId) {
    return { ok: false, error: "That kitchen is not yours to change." };
  }

  const { error } = await client
    .from("restaurants")
    .update({ image_src: cover.src, image_alt: cover.alt })
    .eq("id", input.restaurantId);

  if (error) return { ok: false, error: "We could not change the cover. Try again." };

  // Do not leave the replaced photograph sitting in storage.
  const previous = publicIdFromUrl(kitchen.image_src ?? "");
  if (previous && previous !== publicIdFromUrl(cover.src)) await destroyImage(previous);

  revalidatePath("/dashboard");
  revalidatePath("/food");

  return { ok: true, data: { imageSrc: cover.src } };
}

/* -------------------------------------------------------------------------- */
/* Parcels                                                                     */
/* -------------------------------------------------------------------------- */
export async function sendParcel(input: {
  parcelType: string;
  parcelSize: ParcelSize;
  quantity: number;
  pickup: string;
  dropoff: string;
  recipient: string;
  phone: string;
  details: string;
  /** The chosen pick-up instant, or null when the courier goes now. */
  scheduledFor: string | null;
}): Promise<ActionResult<ParcelSent>> {
  if (!input.pickup.trim() || !input.dropoff.trim()) {
    return { ok: false, error: "Add a pick-up and a drop-off." };
  }

  // A courier has to know who they are handing the parcel to.
  if (!input.recipient.trim()) {
    return { ok: false, error: "Add the name of the person receiving this parcel." };
  }

  // A scheduled booking has to carry a real instant, never a fixed window.
  let scheduledFor: string | null = null;
  if (input.scheduledFor) {
    const moment = new Date(input.scheduledFor);
    if (Number.isNaN(moment.getTime())) {
      return { ok: false, error: "Choose a pick-up date and time." };
    }
    scheduledFor = moment.toISOString();
  }

  const type = parcelTypes.find((entry) => entry.id === input.parcelType || entry.name === input.parcelType);
  if (!type) return { ok: false, error: "Choose what you are sending." };

  // Every parcel is charged on its own, so the count is what moves the price.
  const quantity = clampQuantity(input.quantity);
  const quote = quoteParcel(type, input.parcelSize);
  const price = quote.price * quantity;
  const client = createAdminClient();

  if (!client) {
    return {
      ok: true,
      data: {
        id: mintId("par"),
        trackingNumber: parcelTrackingNumber(Math.floor(Math.random() * 9000) + 1000),
        price,
        etaMinutes: quote.etaMinutes,
        demo: true,
      },
    };
  }

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to send a parcel." };

  await ensureProfile(client, userId);

  const id = mintId("par");
  const trackingNumber = parcelTrackingNumber(Math.floor(Math.random() * 9000) + 1000);

  const { error } = await client.from("parcels").insert({
    id,
    user_id: userId,
    courier_id: null,
    parcel_type: type.name,
    parcel_size: input.parcelSize,
    quantity,
    recipient_name: input.recipient.trim(),
    recipient_phone: input.phone.trim(),
    details: input.details.trim(),
    pickup: input.pickup.trim(),
    pickup_area: "",
    dropoff: input.dropoff.trim(),
    dropoff_area: "",
    distance_km: quote.distanceKm,
    price,
    eta_minutes: quote.etaMinutes,
    status: "booked",
    tracking_number: trackingNumber,
    scheduled_for: scheduledFor,
    requested_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: "We could not book that courier. Try again." };

  revalidatePath("/bookings");
  revalidatePath("/track");
  revalidatePath("/parcels");

  return {
    ok: true,
    data: {
      id,
      trackingNumber,
      price: quote.price,
      etaMinutes: quote.etaMinutes,
      demo: false,
    },
  };
}
