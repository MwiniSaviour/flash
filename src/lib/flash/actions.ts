"use server";

import { revalidatePath } from "next/cache";

import { currentClerkIdentity, currentUserId } from "@/lib/auth/server";
import { cancelDispatchJob, createDispatchJob, dispatchConfigured } from "@/lib/dispatch/client";
import { dispatchPatch, isDispatchTerminal } from "@/lib/dispatch/status";
import {
  engineRideClass,
  type CreateDispatchJobInput,
  type DispatchContact,
  type DispatchJobDTO,
  type DispatchLocation,
  type DispatchPaymentMethod,
  type DispatchRequestType,
} from "@/lib/dispatch/types";
import { getEnv } from "@/lib/env";
import { commitImageWrite } from "@/lib/media/cloudinary";
import { isOwnedCloudinaryUrl, publicIdFromUrl } from "@/lib/media/url";
import { paystackConfigured } from "@/lib/payments/paystack";
import { computeTicketCommission, platformSettings } from "@/lib/payments/commission";
import { confirmDelivery, recordCashCommission, startCheckout } from "@/lib/payments/service";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";

import { haversineKm, type GeoPoint } from "./geo";
import { findCover } from "./covers";
import {
  parcelQuote,
  parcelTrackingNumber,
  parcelTypes,
  quoteParcel,
  type ParcelSize,
} from "./data/parcels";
import { assertSellerOwns } from "./ownership";
import { ensureProfile } from "./profile";
import { activeDiscountPercent, deliveryQuote, discountOn, rideFareCedis } from "./pricing";
import { isBusinessAccount } from "./repository";
import type { Fulfilment } from "./types";
import {
  notifyCompletion,
  notifyManagerNewSale,
  notifyPurchaseConfirmed,
  notifyVendorNewOrder,
} from "@/lib/notifications/service";
/**
 * The writes.
 *
 * Every mutation in ScalDive goes through one of these actions, so there is a
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

export type CheckoutIntent = {
  reference: string;
  accessCode: string | null;
  amountPesewas: number;
  email: string;
  checkoutUrl: string | null;
};

export type TicketBooking = {
  id: string;
  reference: string;
  total: number;
  demo: boolean;
  checkoutUrl?: string | null;
  checkout?: CheckoutIntent;
};

export type OrderPlaced = {
  id: string;
  reference: string;
  number: string;
  total: number;
  etaMinutes: number;
  demo: boolean;
  checkoutUrl?: string | null;
  checkout?: CheckoutIntent;
};

export type RideRequested = {
  id: string;
  reference: string;
  number: string;
  price: number;
  etaMinutes: number;
  demo: boolean;
  checkoutUrl?: string | null;
  checkout?: CheckoutIntent;
};

export type ParcelSent = {
  id: string;
  trackingNumber: string;
  price: number;
  etaMinutes: number;
  demo: boolean;
  checkoutUrl?: string | null;
  checkout?: CheckoutIntent;
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
/* Dispatch hand-off                                                           */
/* -------------------------------------------------------------------------- */

/**
 * ScalDive has no maps yet, so every route still uses the demo distance and one
 * Accra anchor. The engine needs coordinates to assign a driver; these are
 * reference points, not a map tile or a live location.
 */
const ACCRA_ANCHOR = { region: "Greater Accra", lat: 5.6037, lng: -0.187 } as const;

function dispatchPoint(
  street: string,
  area: string,
  point?: { lat: number; lng: number },
): DispatchLocation {
  const name = street.trim();
  const district = area.trim();
  const coordinates = point ?? ACCRA_ANCHOR;

  return {
    name,
    address: district ? `${name}, ${district}` : name,
    ...(district ? { area: district } : {}),
    region: ACCRA_ANCHOR.region,
    lat: coordinates.lat,
    lng: coordinates.lng,
  };
}

async function dispatchContact(
  client: AdminClient,
  userId: string,
  phone: string,
): Promise<DispatchContact> {
  const profile = await ensureProfile(client, userId);
  const identity = await currentClerkIdentity();

  return {
    name: profile.name || identity?.name || "ScalDive customer",
    phone: phone.trim(),
    email: profile.email || identity?.email || undefined,
  };
}

/** A card or mobile-money ride is collected by Paystack, on delivery by the driver. */
async function checkoutForDispatch(input: {
  kind: "ride" | "parcel";
  userId: string;
  email: string;
  price: number;
  id: string;
  paymentMethod: DispatchPaymentMethod;
}): Promise<CheckoutIntent | null> {
  if (input.paymentMethod === "pod" || !paystackConfigured()) return null;

  // The whole fare is the driver's charge, so it is passed as the delivery fee:
  // the commission is taken from it and driver_pesewas holds the net.
  const shared = {
    userId: input.userId,
    email: input.email,
    itemsCedis: 0,
    deliveryFeeCedis: input.price,
    selfDelivery: false,
  };

  const checkout =
    input.kind === "ride"
      ? await startCheckout({ ...shared, kind: "ride", rideId: input.id })
      : await startCheckout({ ...shared, kind: "parcel", parcelId: input.id });

  if (!checkout.checkoutUrl) return null;

  return {
    reference: checkout.reference,
    accessCode: checkout.accessCode,
    amountPesewas: checkout.amountPesewas,
    email: checkout.email,
    checkoutUrl: checkout.checkoutUrl,
  };
}

/**
 * Posts a job after the local row exists and stores the ids the engine returns.
 * A failure cancels the row we just made and surfaces the engine's message —
 * a booking never pretends to be dispatched when it was not.
 */
async function handoffToDispatch(
  client: AdminClient,
  input: {
    id: string;
    deviceId: string;
    kind: DispatchRequestType;
    table: "rides" | "parcels";
    payload: Omit<CreateDispatchJobInput, "idempotencyKey" | "deviceId">;
  },
): Promise<{ ok: true; job: DispatchJobDTO | null } | { ok: false; error: string }> {
  if (!dispatchConfigured()) {
    return {
      ok: true as const,
      job: null,
    };
  }

  const idempotencyKey = `flash_${input.kind}_${input.id}`;

  try {
    const job = await createDispatchJob({
      ...input.payload,
      idempotencyKey,
      deviceId: input.deviceId,
    });

    const { error } = await client
      .from(input.table)
      .update({
        ...dispatchPatch(job, input.kind),
        dispatch_app_id: getEnv().dispatchAppId,
        dispatch_idempotency_key: idempotencyKey,
      })
      .eq("id", input.id);

    if (error) throw new Error("the dispatch result could not be saved");
    return { ok: true, job };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "the engine could not be reached";
    await client
      .from(input.table)
      .update({ status: "cancelled", dispatch_last_payload: { error: message } })
      .eq("id", input.id);

    return {
      ok: false,
      error: `We could not send this ${input.kind} to dispatch: ${message}. Nothing was charged.`,
    };
  }
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

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to book a ticket." };

  if (!client) throw new Error("Database is not configured");

  // Every row that carries a user_id needs the profile row to exist first.
  await ensureProfile(client, userId);

  const { data: tier, error: tierError } = await client
    .from("event_tiers")
    .select("id, name, price, event_id, available, sales_closed, events(owner_user_id, title, business_id)")
    .eq("id", input.tierId)
    .maybeSingle();

  if (tierError) throw tierError;
  if (!tier) return { ok: false, error: "That ticket is no longer available." };
  if (tier.sales_closed || tier.available < quantity) {
    return { ok: false, error: "Ticket sales for this tier are closed." };
  }

  const id = mintId("tkt");
  const reference = mintReference();
  const unitPricePesewas = Math.max(0, Math.round(tier.price * 100));
  const isFree = unitPricePesewas === 0;
  const settings = await platformSettings();
  const ticketCommission = computeTicketCommission({
    unitPricePesewas,
    quantity,
    settings,
  });

  // One locked write checks capacity, moves the counters and inserts the ticket.
  const { error: reserveError } = await client.rpc("reserve_ticket", {
    p_tier_id: tier.id,
    p_user_id: userId,
    p_ticket_id: id,
    p_reference: reference,
    p_quantity: quantity,
    p_unit_price_pesewas: unitPricePesewas,
    p_commission_pesewas: ticketCommission.commissionPesewas,
    p_status: isFree ? "confirmed" : "pending",
  });

  if (reserveError) {
    const message = reserveError.message ?? "We could not hold those tickets.";
    return { ok: false, error: message };
  }

  if (isFree) {
    // No charge to the attendee. The planner owes a flat per-attendee fee and
    // settles it from the planner console through Paystack.
    const eventOwner =
      (tier.events as unknown as { owner_user_id: string | null } | null)?.owner_user_id ?? userId;

    const { error: dueError } = await client.from("payments").insert({
      id: mintId("due"),
      user_id: userId,
      payer_user_id: eventOwner,
      kind: "ticket",
      reference: mintReference(),
      provider: "paystack",
      status: "pending",
      amount_pesewas: ticketCommission.commissionPesewas,
      commission_pesewas: ticketCommission.commissionPesewas,
      ticket_id: id,
    });

    if (dueError) throw dueError;
  }

  const total = tier.price * quantity;
  const identity = await currentClerkIdentity();
  const tierEvent = (tier.events as unknown as {
    title?: string;
    owner_user_id?: string | null;
    business_id?: string | null;
  } | null) ?? {};

  void notifyPurchaseConfirmed({
    userId,
    refType: "ticket",
    refId: id,
    reference,
    total,
    email: { to: identity?.email ?? "" },
  });
  if (tierEvent.owner_user_id) {
    void notifyManagerNewSale({
      ownerUserId: tierEvent.owner_user_id,
      businessId: tierEvent.business_id ?? null,
      ticketId: id,
      event: tierEvent.title ?? "Event",
      tier: tier.name,
      quantity,
    });
  }

  if (!isFree && paystackConfigured()) {
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

      if (!checkout.checkoutUrl) {
        await client.rpc("release_ticket", { p_ticket_id: id });
        return { ok: false, error: "We could not start the payment." };
      }

      return {
        ok: true,
        data: {
          id,
          reference,
          total,
          demo: false,
          checkoutUrl: checkout.checkoutUrl,
          checkout: {
            reference: checkout.reference,
            accessCode: checkout.accessCode,
            amountPesewas: checkout.amountPesewas,
            email: checkout.email,
            checkoutUrl: checkout.checkoutUrl,
          },
        },
      };
    }
  }

  revalidatePath("/bookings");
  revalidatePath("/tickets");

  return {
    ok: true,
    data: { id, reference, total, demo: false },
  };
}

/** A request to be told when a sold-out tier opens up again. */
export async function requestTickets(input: {
  eventId: string;
  tierId: string;
  name: string;
  phone: string;
  email: string;
  quantity: number;
  note?: string;
}): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Tell us who wants the ticket." };

  const quantity = clampQuantity(input.quantity);
  const client = createAdminClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to ask for a ticket." };

  if (!client) throw new Error("Database is not configured");

  const { data: existing } = userId
    ? await client
        .from("ticket_requests")
        .select("id")
        .eq("tier_id", input.tierId)
        .eq("user_id", userId)
        .eq("status", "pending")
        .maybeSingle()
    : { data: null };

  if (existing) {
    return { ok: false, error: "You already have a request in for this tier." };
  }

  const id = mintId("treq");
  const { error } = await client.from("ticket_requests").insert({
    id,
    event_id: input.eventId,
    tier_id: input.tierId,
    user_id: userId,
    name,
    phone: input.phone.trim(),
    email: input.email.trim(),
    quantity,
    note: input.note?.trim() ?? "",
    status: "pending",
  });

  if (error) return { ok: false, error: "We could not save your request. Try again." };

  revalidatePath("/admin/requests");
  return { ok: true, data: { id } };
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

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to place an order." };

  if (!client) throw new Error("Database is not configured");

  await ensureProfile(client, userId);

  const { data: restaurant, error: restaurantError } = await client
    .from("restaurants")
    .select("id, name, delivery_fee, distance_km, eta_minutes, discount_percent, owner_user_id, business_id")
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

  const settings = await platformSettings();
  const deliveryFee = deliveryQuote(
    { deliveryFee: restaurant.delivery_fee, distanceKm: restaurant.distance_km },
    fulfilment,
    settings,
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

  const orderIdentity = await currentClerkIdentity();
  const itemCount = orderLines.reduce((sum, line) => sum + line.quantity, 0);
  void notifyPurchaseConfirmed({
    userId,
    refType: "order",
    refId: id,
    reference,
    total: subtotal - discount + deliveryFee,
    email: { to: orderIdentity?.email ?? "" },
  });
  if (restaurant.owner_user_id) {
    void notifyVendorNewOrder({
      ownerUserId: restaurant.owner_user_id,
      businessId: restaurant.business_id ?? null,
      orderId: id,
      restaurant: restaurant.name,
      itemCount,
      orderNumber: number,
    });
  }

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
        checkout: {
          reference: checkout.reference,
          accessCode: checkout.accessCode,
          amountPesewas: checkout.amountPesewas,
          email: checkout.email,
          checkoutUrl: checkout.checkoutUrl,
        },
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
  pickupPoint?: GeoPoint;
  dropoffPoint?: GeoPoint;
  distanceKm?: number;
  durationMinutes?: number;
  /** The chosen pick-up instant, or null when the rider goes now. */
  scheduledFor?: string | null;
  /** The number the rider can call. Required once a real booking is dispatched. */
  phone?: string;
  paymentMethod?: DispatchPaymentMethod;
}): Promise<ActionResult<RideRequested>> {
  if (!input.pickup.trim() || !input.dropoff.trim()) {
    return { ok: false, error: "Add a pick-up and a drop-off." };
  }

  let scheduledFor: string | null = null;
  if (input.scheduledFor) {
    const moment = new Date(input.scheduledFor);
    if (Number.isNaN(moment.getTime())) {
      return { ok: false, error: "Choose a pick-up date and time." };
    }
    scheduledFor = moment.toISOString();
  }

  const paymentMethod = input.paymentMethod ?? "pod";
  const client = createAdminClient();

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to book a ride." };
  if (!input.phone?.trim()) {
    return { ok: false, error: "Add a phone number so the rider can reach you." };
  }

  if (!client) throw new Error("Database is not configured");

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

  // The browser supplies a point; the server recomputes the distance so a
  // client cannot quote its own journey. Without a point we keep the demo route.
  const distanceKm =
    input.pickupPoint && input.dropoffPoint
      ? Math.round(haversineKm(input.pickupPoint, input.dropoffPoint) * 10) / 10
      : 3.8;
  const durationMinutes = input.durationMinutes ?? Math.max(1, Math.round((distanceKm / 28) * 60 + 3));
  const settings = await platformSettings();
  const fare = rideFareCedis(rideClass.id, distanceKm, settings);

  const { error } = await client.from("rides").insert({
    id,
    user_id: userId,
    rider_id: null,
    ride_class: rideClass.id,
    pickup: input.pickup.trim(),
    pickup_area: "",
    dropoff: input.dropoff.trim(),
    dropoff_area: "",
    distance_km: distanceKm,
    duration_minutes: durationMinutes,
    eta_minutes: durationMinutes,
    price: fare,
    passengers,
    status: scheduledFor ? "scheduled" : "requested",
    number,
    reference,
    scheduled_for: scheduledFor,
    requested_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: "We could not book that ride. Try again." };

  const identity = await currentClerkIdentity();
  const handoffResult = await handoffToDispatch(client, {
    id,
    deviceId: userId,
    kind: "ride",
    table: "rides",
    payload: {
      requestType: "ride",
      contact: await dispatchContact(client, userId, input.phone),
      pickup: dispatchPoint(input.pickup, "", input.pickupPoint),
      dropoff: dispatchPoint(input.dropoff, "", input.dropoffPoint),
      rideClass: engineRideClass(rideClass.id),
      scheduledFor: scheduledFor ?? undefined,
      paymentMethod,
    },
  });

  if (!handoffResult.ok) {
    console.error("[dispatch] handoff failed", handoffResult.error);
  }
  const handoff = handoffResult.ok ? handoffResult.job : null;

  void notifyPurchaseConfirmed({
    userId,
    refType: "ride",
    refId: id,
    reference,
    total: handoff?.fare ?? fare,
    email: { to: identity?.email ?? "" },
  });

  const checkout = await checkoutForDispatch({
    kind: "ride",
    userId,
    email: identity?.email ?? "",
    price: fare,
    id,
    paymentMethod,
  });

  revalidatePath("/bookings");
  revalidatePath("/track");
  revalidatePath("/rides");

  return {
    ok: true,
    data: {
      id,
      reference,
      number,
      price: handoff?.fare ?? fare,
      etaMinutes: handoff?.etaMinutes ?? durationMinutes,
      demo: false,
      checkoutUrl: checkout?.checkoutUrl ?? null,
      checkout: checkout ?? undefined,
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

  if (!client) throw new Error("Database is not configured");

  const { data: kitchen, error: kitchenError } = await client
    .from("restaurants")
    .select("id, seller_user_id, owner_user_id, image_src")
    .eq("id", input.restaurantId)
    .maybeSingle();

  if (kitchenError) throw kitchenError;
  if (!kitchen) return { ok: false, error: "That kitchen is no longer here." };
  try {
    assertSellerOwns((kitchen as { seller_user_id?: string | null }).seller_user_id ?? kitchen.owner_user_id, userId, "business_owner");
  } catch {
    return { ok: false, error: "That kitchen is not yours to change." };
  }

  try {
    await commitImageWrite({
      newPublicId: publicIdFromUrl(cover.src),
      previousPublicId: publicIdFromUrl(kitchen.image_src ?? ""),
      write: async () => {
        const { error } = await client
          .from("restaurants")
          .update({ image_src: cover.src, image_alt: cover.alt })
          .eq("id", input.restaurantId);
        if (error) throw error;
      },
    });
  } catch {
    return { ok: false, error: "We could not change the cover. Try again." };
  }

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
  pickupPoint?: GeoPoint;
  dropoffPoint?: GeoPoint;
  distanceKm?: number;
  durationMinutes?: number;
  recipient: string;
  phone: string;
  details: string;
  /** The chosen pick-up instant, or null when the courier goes now. */
  scheduledFor: string | null;
  paymentMethod?: DispatchPaymentMethod;
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
  const distanceKm =
    input.pickupPoint && input.dropoffPoint
      ? Math.round(haversineKm(input.pickupPoint, input.dropoffPoint) * 10) / 10
      : (input.distanceKm ?? parcelQuote.distanceKm);
  const settings = await platformSettings();
  const quote = quoteParcel(type, input.parcelSize, distanceKm, settings);
  const price = quote.price * quantity;
  const client = createAdminClient();
  const paymentMethod = input.paymentMethod ?? "pod";

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to send a parcel." };
  if (!input.phone?.trim()) {
    return { ok: false, error: "Add a phone number so the courier can reach the recipient." };
  }

  if (!client) throw new Error("Database is not configured");

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
    status: scheduledFor ? "scheduled" : "booked",
    tracking_number: trackingNumber,
    scheduled_for: scheduledFor,
    requested_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: "We could not book that courier. Try again." };

  const identity = await currentClerkIdentity();
  const handoffResult = await handoffToDispatch(client, {
    id,
    deviceId: userId,
    kind: "parcel",
    table: "parcels",
    payload: {
      requestType: "parcel",
      contact: await dispatchContact(client, userId, input.phone),
      pickup: dispatchPoint(input.pickup, "", input.pickupPoint),
      dropoff: dispatchPoint(input.dropoff, "", input.dropoffPoint),
      parcelTier: input.parcelSize,
      note: [
        input.details.trim(),
        `Recipient: ${input.recipient.trim()}`,
        quantity > 1 ? `${quantity} parcels of ${type.name}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      scheduledFor: scheduledFor ?? undefined,
      paymentMethod,
    },
  });

  const handoff = handoffResult.ok ? handoffResult.job : null;

  if (!handoffResult.ok) console.error("[dispatch] handoff failed", handoffResult.error);

  void notifyPurchaseConfirmed({
    userId,
    refType: "parcel",
    refId: id,
    reference: trackingNumber,
    total: price,
    email: { to: identity?.email ?? "" },
  });

  const checkout = await checkoutForDispatch({
    kind: "parcel",
    userId,
    email: identity?.email ?? "",
    price,
    id,
    paymentMethod,
  });

  revalidatePath("/bookings");
  revalidatePath("/track");
  revalidatePath("/parcels");

  return {
    ok: true,
    data: {
      id,
      trackingNumber,
      price,
      etaMinutes: handoff?.etaMinutes ?? quote.etaMinutes,
      demo: false,
      checkoutUrl: checkout?.checkoutUrl ?? null,
      checkout: checkout ?? undefined,
    },
  };
}

/** The customer confirms delivery; this is what releases the driver payout. */
export async function confirmDeliveryAction(input: {
  orderId: string;
}): Promise<ActionResult<{ confirmed: boolean }>> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to confirm a delivery." };

  const result = await confirmDelivery({ orderId: input.orderId, userId });
  if (!result.ok) return { ok: false, error: result.error ?? "We could not confirm that delivery." };

  void notifyCompletion({
    userId,
    refType: "order",
    refId: input.orderId,
    reference: input.orderId,
  });

  revalidatePath("/track");
  revalidatePath("/orders");

  return { ok: true, data: { confirmed: true } };
}

/**
 * Cancels a customer's ride or parcel. The engine cancels its own job first;
 * Flash only marks the local row cancelled after the engine confirms it, so a
 * failed dispatch call never leaves the two sides disagreeing.
 */
export async function cancelDeliveryAction(input: {
  id: string;
  kind: "ride" | "parcel";
}): Promise<ActionResult<{ status: "cancelled" }>> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to cancel a booking." };

  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured");

  const table = input.kind === "ride" ? "rides" : "parcels";
  const { data: row, error: readError } = await client
    .from(table)
    .select("id, user_id, status, dispatch_job_id, dispatch_task_status")
    .eq("id", input.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) throw readError;
  if (!row) return { ok: false, error: "That booking is not yours to cancel." };

  const current = row as {
    user_id: string;
    status: string;
    dispatch_job_id: string | null;
    dispatch_task_status: string | null;
  };

  if (current.user_id !== userId) {
    return { ok: false, error: "That booking is not yours to cancel." };
  }

  if (current.status === "cancelled" || isDispatchTerminal(current.dispatch_task_status ?? current.status)) {
    return { ok: true, data: { status: "cancelled" } };
  }

  let patch: Record<string, unknown> = { status: "cancelled" };
  if (current.dispatch_job_id) {
    if (!dispatchConfigured()) {
      return { ok: false, error: "Dispatch is not configured." };
    }
    const job = await cancelDispatchJob(current.dispatch_job_id);
    patch = { ...dispatchPatch(job, input.kind), status: "cancelled" };
  }

  const { error: updateError } = await client
    .from(table)
    .update(patch)
    .eq("id", input.id)
    .eq("user_id", userId);

  if (updateError) throw updateError;

  revalidatePath("/track");
  revalidatePath("/bookings");
  revalidatePath(input.kind === "ride" ? `/rides/${input.id}` : `/parcels/${input.id}`);
  return { ok: true, data: { status: "cancelled" } };
}

/**
 * Books several ticket tiers in one checkout, so a basket with a General and
 * a VIP line produces one payment and one Paystack redirect.
 */
export async function bookTicketBatch(input: {
  lines: { tierId: string; quantity: number }[];
  paymentMethod?: "online" | "cash";
}): Promise<ActionResult<{ references: string[]; total: number; checkoutUrl: string | null; checkout?: CheckoutIntent; demo?: boolean }>> {
  const lines = input.lines
    .map((line) => ({ tierId: line.tierId, quantity: clampQuantity(line.quantity) }))
    .filter((line) => line.quantity > 0);

  if (lines.length === 0) return { ok: false, error: "Choose at least one ticket." };

  const client = createAdminClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to book tickets." };

  if (!client) throw new Error("Database is not configured");

  await ensureProfile(client, userId);
  const settings = await platformSettings();
  const identity = await currentClerkIdentity();

  let total = 0;
  const references: string[] = [];
  const made: string[] = [];

  for (const line of lines) {
    const { data: tier } = await client
      .from("event_tiers")
      .select("id, name, price, event_id, available, sales_closed, events(owner_user_id, title, business_id)")
      .eq("id", line.tierId)
      .maybeSingle();

    if (!tier || tier.sales_closed || tier.available < line.quantity) {
      for (const ticketId of made) await client.rpc("release_ticket", { p_ticket_id: ticketId });
      return { ok: false, error: "One of those tiers just sold out. Check the basket and try again." };
    }

    const unit = Math.max(0, Math.round(tier.price * 100));
    const commission = computeTicketCommission({
      unitPricePesewas: unit,
      quantity: line.quantity,
      settings,
    });

    const id = mintId("tkt");
    const reference = mintReference();
    const { error } = await client.rpc("reserve_ticket", {
      p_tier_id: tier.id,
      p_user_id: userId,
      p_ticket_id: id,
      p_reference: reference,
      p_quantity: line.quantity,
      p_unit_price_pesewas: unit,
      p_commission_pesewas: commission.commissionPesewas,
      p_status: unit === 0 ? "confirmed" : "pending",
    });

    if (error) {
      for (const ticketId of made) await client.rpc("release_ticket", { p_ticket_id: ticketId });
      return { ok: false, error: error.message ?? "We could not hold those tickets." };
    }

    made.push(id);
    references.push(reference);
    total += tier.price * line.quantity;

    const batchEvent = (tier.events as unknown as {
      title?: string;
      owner_user_id?: string | null;
      business_id?: string | null;
    } | null) ?? {};
    void notifyPurchaseConfirmed({
      userId,
      refType: "ticket",
      refId: id,
      reference,
      total: tier.price * line.quantity,
      email: { to: identity?.email ?? "" },
    });
    if (batchEvent.owner_user_id) {
      void notifyManagerNewSale({
        ownerUserId: batchEvent.owner_user_id,
        businessId: batchEvent.business_id ?? null,
        ticketId: id,
        event: batchEvent.title ?? "Event",
        tier: tier.name,
        quantity: line.quantity,
      });
    }

    if (unit === 0) {
      const owner =
        (tier.events as unknown as { owner_user_id: string | null } | null)?.owner_user_id ?? userId;
      await client.from("payments").insert({
        id: mintId("due"),
        user_id: userId,
        payer_user_id: owner,
        kind: "ticket",
        reference: mintReference(),
        provider: "paystack",
        status: "pending",
        amount_pesewas: commission.commissionPesewas,
        commission_pesewas: commission.commissionPesewas,
      });
    }
  }

  let checkoutUrl: string | null = null;
  let checkoutIntent: CheckoutIntent | null = null;

  if (total > 0 && paystackConfigured() && input.paymentMethod !== "cash") {
    const checkout = await startCheckout({
      kind: "ticket",
      userId,
      email: identity?.email ?? "",
      itemsCedis: total,
      deliveryFeeCedis: 0,
      selfDelivery: false,
      ticketId: made[0] ?? undefined,
    });
    checkoutUrl = checkout.checkoutUrl;
    checkoutIntent = {
      reference: checkout.reference,
      accessCode: checkout.accessCode,
      amountPesewas: checkout.amountPesewas,
      email: checkout.email,
      checkoutUrl,
    };

    if (!checkoutUrl) {
      for (const ticketId of made) await client.rpc("release_ticket", { p_ticket_id: ticketId });
      return { ok: false, error: "We could not start the payment." };
    }
  }

  revalidatePath("/bookings");
  revalidatePath("/tickets");

  return { ok: true, data: { references, total, checkoutUrl, checkout: checkoutIntent ?? undefined } };
}
