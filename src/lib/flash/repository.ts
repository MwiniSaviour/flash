
/** Demo sold-out requests are held with the other mutable fixtures. */
function demoTicketRequests(): TicketRequest[] {
  if (!demoStore.ticketRequests) {
    demoStore.ticketRequests = [
      {
        id: "treq-demo-1",
        eventId: "evt-urban-vibes-festival",
        tierId: "tier-urban-vip",
        userId: DEMO_USER_ID,
        name: "Ama Owusu",
        phone: "+233 24 555 0101",
        email: "ama@example.gh",
        quantity: 2,
        status: "pending",
        note: "Two seats together if possible.",
        createdAt: "2026-11-18T09:20:00.000Z",
        decidedAt: null,
        eventTitle: "Urban Vibes Festival",
        tierName: "VIP Experience",
      },
    ];
  }
  return demoStore.ticketRequests;
}

/**
 * The data seam.
 *
 * Every screen reads through this module. When Supabase is connected the reads
 * come from Postgres and the row mappers below turn the snake_case columns
 * into the camelCase view models the UI consumes; when it is not, the seeded
 * demo fixtures answer instead. No screen knows which one it got.
 *
 * The browser never touches the database. The repository runs on the server and
 * holds the service-role client, so every query has to scope itself to the
 * signed-in customer — the service role bypasses Row Level Security.
 */

import { currentRole, currentUserId } from "@/lib/auth/server";
import { dispatchConfigured, getDispatchJob } from "@/lib/dispatch/client";
import {
  canonicalState,
  dispatchPatch,
  driverFromDispatchJob,
  isDispatchTerminal,
} from "@/lib/dispatch/status";
import type { DispatchRequestType } from "@/lib/dispatch/types";
import { getEnv } from "@/lib/env";
import { notifyCompletion } from "@/lib/notifications/service";
import { releaseDriverPayoutForDispatch } from "@/lib/payments/service";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";

import { accountStore } from "./account-store";
import { user } from "./data/account";
import { demoStore } from "./data/demo-store";
import { businesses, incomingOrders, incomingTickets } from "./data/business";
import { events } from "./data/events";
import { DEMO_USER_ID } from "./data/business";
import { restaurants } from "./data/food";
import { rideClasses, rideQuote } from "./data/rides";
import type { Delivery, PastDelivery } from "./data/tracking";
import { canManageBusiness } from "./roles";
import {
  doorsTime,
  orderToDelivery,
  orderToPastDelivery,
  parcelToDelivery,
  parcelToPastDelivery,
  rideToDelivery,
  rideToPastDelivery,
} from "./delivery";
import { ensureProfile } from "./profile";
import { discountLabel } from "./pricing";
import { DEMO_TODAY } from "./format";
import type {
  Booking,
  BookingStatus,
  Business,
  Event,
  FlashUser,
  Fulfilment,
  Order,
  OrderLine,
  Restaurant,
  RideClass,
  RideQuote,
  SavedPlace,
  Ticket,
  TicketRequest,
  TicketStatus,
} from "./types";
import type {
  BusinessRow,
  DriverRow,
  EventRow,
  EventWithTiersRow,
  MenuItemRow,
  OrderWithLinesRow,
  ParcelWithCourierRow,
  ProfileRow,
  RestaurantRow,
  RestaurantWithMenuRow,
  RideClassRow,
  RideWithRiderRow,
  SavedPlaceRow,
  TicketRow,
  TicketRequestRow,
  TicketTierRow,
} from "./rows";

/* -------------------------------------------------------------------------- */
/* Mappers                                                                     */
/* -------------------------------------------------------------------------- */

type EventRecord = EventRow & { tiers: TicketTierRow[] };
type RestaurantRecord = RestaurantRow & {
  menu: (MenuItemRow & {
    sizes: { id: string; name: string; price: number; position: number }[];
    toppings: { id: string; name: string; price: number; position: number }[];
  })[];
};

export function toEvent(row: EventRecord): Event {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    venue: row.venue,
    neighbourhood: row.neighbourhood,
    city: row.city,
    distanceKm: row.distance_km,
    date: row.event_date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    image: { src: row.image_src, alt: row.image_alt },
    categories: row.categories as Event["categories"],
    featured: row.featured,
    trending: row.trending,
    live: row.live,
    priceFrom: row.price_from,
    discount: row.discount_percent
      ? { label: discountLabel(row.discount_percent), percent: row.discount_percent }
      : undefined,
    businessId: row.business_id ?? undefined,
    tiers: row.tiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      description: tier.description,
      price: tier.price,
      perks: tier.perks,
      available: tier.available,
      salesClosed: tier.sales_closed,
      discountPercent: tier.discount_percent ?? 0,
      discountStartsAt: tier.discount_starts_at ?? undefined,
      discountEndsAt: tier.discount_ends_at ?? undefined,
    })),
    going: row.going,
    capacity: row.capacity,
  };
}

export function toRestaurant(row: RestaurantRecord): Restaurant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    cuisine: row.cuisine as Restaurant["cuisine"],
    neighbourhood: row.neighbourhood,
    rating: row.rating,
    ratingCount: row.rating_count,
    deliveryFee: row.delivery_fee,
    etaMinutes: row.eta_minutes,
    distanceKm: row.distance_km,
    badge: row.badge ?? undefined,
    discount: row.discount_percent
      ? { label: discountLabel(row.discount_percent), percent: row.discount_percent }
      : undefined,
    ownerId: row.owner_user_id ?? undefined,
    businessId: row.business_id ?? undefined,
    image: { src: row.image_src, alt: row.image_alt },
    menu: row.menu.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: { src: item.image_src, alt: item.image_alt },
      popular: item.popular,
      vegetarian: item.vegetarian,
      tagline: item.tagline,
      tags: item.tags ?? [],
      discountPercent: item.discount_percent ?? 0,
      discountStartsAt: item.discount_starts_at ?? undefined,
      discountEndsAt: item.discount_ends_at ?? undefined,
      sizes: [...(item.sizes ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((size) => ({ id: size.id, name: size.name, price: size.price })),
      toppings: [...(item.toppings ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((topping) => ({ id: topping.id, name: topping.name, price: topping.price })),
    })),
  };
}

function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    userId: row.user_id,
    eventId: row.event_id,
    tierId: row.tier_id ?? "",
    tierName: row.tier_name,
    quantity: row.quantity,
    status: row.status as TicketStatus,
    reference: row.reference,
    purchasedAt: row.purchased_at,
    unitPricePesewas: row.unit_price_pesewas,
  };
}

function toDriver(row: DriverRow | null) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    rating: row.rating,
    photo: { src: row.photo_src, alt: row.photo_alt },
    plate: row.plate,
    vehicle: row.vehicle,
    completedRides: row.completed_rides,
  };
}

function toOrderLines(rows: OrderWithLinesRow["order_lines"]): OrderLine[] {
  return (rows ?? []).map((line) => ({
    menuItemId: line.menu_item_id ?? line.id,
    name: line.name,
    quantity: line.quantity,
    price: line.price,
    size: line.size || undefined,
    toppings: line.toppings?.length ? line.toppings : undefined,
  }));
}

function toOrder(row: OrderWithLinesRow): Order {
  const driver = toDriver(row.drivers);

  return {
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    number: row.number,
    fulfilment: (row.fulfilment as Fulfilment) ?? "delivery",
    status: row.status as Order["status"],
    lines: toOrderLines(row.order_lines),
    subtotal: row.subtotal,
    discount: row.discount ?? 0,
    deliveryFee: row.delivery_fee,
    placedAt: row.placed_at,
    etaMinutes: row.eta_minutes,
    address: row.address,
    rider: driver ?? {
      id: "",
      name: "Rider being assigned",
      rating: 0,
      photo: { src: "", alt: "The rider being assigned to this order" },
      plate: "",
      vehicle: "",
      completedRides: 0,
    },
    reference: row.reference,
  };
}

function toFlashUser(row: ProfileRow): FlashUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_src,
    memberSince: row.member_since,
    notificationsEnabled: row.notifications_enabled,
  };
}

function toRideClass(row: RideClassRow): RideClass {
  return {
    id: row.id as RideClass["id"],
    name: row.name,
    description: row.description,
    seats: row.seats,
    etaMinutes: row.eta_minutes,
    price: row.price,
    perk: row.perk,
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** An event's wall-clock start, read as the UTC instant the app renders. */
function eventStart(eventDate: string, startTime: string): string {
  const [hour = "00", minute = "00", second = "00"] = startTime.split(":");
  return `${eventDate}T${hour}:${minute}:${second}.000Z`;
}

const TICKET_STATUS: Record<string, BookingStatus> = {
  confirmed: "confirmed",
  pending: "pending",
  used: "completed",
};

/** One ledger status for rides and parcels, whatever vocabulary they arrived in. */
function bookingStatus(status: string): BookingStatus {
  const state = canonicalState(status);

  if (state === "failed" || state === "returned" || state === "cancelled") return "cancelled";
  if (state === "delivered") return "completed";
  if (state === "scheduled" || state === "due" || state === "unassigned" || state === "offered") {
    return "pending";
  }
  return "confirmed";
}

const ORDER_STATUS: Record<string, BookingStatus> = {
  preparing: "pending",
  "on the way": "confirmed",
  delivered: "completed",
};

/* -------------------------------------------------------------------------- */
/* Live reads                                                                  */
/* -------------------------------------------------------------------------- */

async function liveEvents(client: AdminClient): Promise<Event[]> {
  const { data, error } = await client
    .from("events")
    .select("*, event_tiers(*)")
    .order("event_date", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as EventWithTiersRow[]).map((row) =>
    toEvent({ ...row, tiers: row.event_tiers ?? [] }),
  );
}

async function liveRestaurants(client: AdminClient): Promise<Restaurant[]> {
  const { data, error } = await client
    .from("restaurants")
    .select("*, menu_items(*, menu_item_sizes(*), menu_item_toppings(*))")
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as RestaurantWithMenuRow[]).map((row) =>
    toRestaurant(toRestaurantRecord(row)),
  );
}

/** The row shape the restaurant mapper reads, with the nested menus flattened. */
function toRestaurantRecord(row: RestaurantWithMenuRow): RestaurantRecord {
  return {
    ...row,
    menu: (row.menu_items ?? []).map((item) => ({
      ...item,
      sizes: item.menu_item_sizes ?? [],
      toppings: item.menu_item_toppings ?? [],
    })),
  };
}

async function liveProfile(client: AdminClient, userId: string): Promise<FlashUser> {
  return toFlashUser(await ensureProfile(client, userId));
}

async function liveTickets(client: AdminClient, userId: string): Promise<Ticket[]> {
  const { data, error } = await client
    .from("tickets")
    .select("*")
    .eq("user_id", userId)
    .order("purchased_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as TicketRow[]).map(toTicket);
}

async function liveOrders(client: AdminClient, userId: string): Promise<OrderWithLinesRow[]> {
  const { data, error } = await client
    .from("orders")
    .select("*, restaurants(*), drivers(*), order_lines(*)")
    .eq("user_id", userId)
    .order("placed_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as OrderWithLinesRow[];
}

/**
 * Poll only dispatched rows that can still move. The Track screen already
 * refreshes every 15 seconds; the short throttle stops a single render from
 * hitting the same job twice. An engine outage never breaks a page — the last
 * snapshot is still rendered.
 */
const DISPATCH_POLL_THROTTLE_MS = 5000;
const lastDispatchPoll = new Map<string, number>();

type DispatchableRow = {
  id: string;
  status: string;
  dispatch_job_id: string | null;
  dispatch_task_status: string | null;
  drivers: DriverRow | null;
};

async function syncDispatchRows<T extends DispatchableRow>(
  client: AdminClient,
  table: "rides" | "parcels",
  rows: T[],
  kind: DispatchRequestType,
): Promise<T[]> {
  if (!dispatchConfigured() || rows.length === 0) return rows;

  const now = Date.now();
  const due = rows.filter((row) => {
    if (!row.dispatch_job_id) return false;
    if (isDispatchTerminal(row.dispatch_task_status ?? row.status)) return false;
    return now - (lastDispatchPoll.get(row.dispatch_job_id) ?? 0) >= DISPATCH_POLL_THROTTLE_MS;
  });

  if (due.length === 0) return rows;

  const results = await Promise.allSettled(
    due.map(async (row) => {
      const jobId = row.dispatch_job_id as string;
      lastDispatchPoll.set(jobId, now);

      const job = await getDispatchJob(jobId);
      const patch = dispatchPatch(job, kind);
      const { error } = await client
        .from(table)
        .update({ ...patch, dispatch_app_id: getEnv().dispatchAppId })
        .eq("id", row.id);

      if (error) throw error;

      // Delivery is the engine's payout trigger; the order path stays with the
      // customer's confirmation in payments/service.ts.
      if (canonicalState(patch.dispatch_task_status) === "delivered") {
        await releaseDriverPayoutForDispatch({ jobId });
        const { data: booking } = await client
          .from(table)
          .select("user_id, reference, tracking_number")
          .eq("id", row.id)
          .maybeSingle();
        if (booking) {
          void notifyCompletion({
            userId: booking.user_id,
            refType: kind,
            refId: row.id,
            reference: booking.reference ?? booking.tracking_number ?? row.id,
          });
        }
      }

      return { row, patch, driver: driverFromDispatchJob(job) };
    }),
  );

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { row, patch, driver } = result.value;
    Object.assign(row, patch);
    if (driver) row.drivers = driver;
  }

  return rows;
}

async function liveRides(client: AdminClient, userId: string): Promise<RideWithRiderRow[]> {
  const { data, error } = await client
    .from("rides")
    .select("*, drivers(*), ride_classes(name)")
    .eq("user_id", userId)
    .order("requested_at", { ascending: false });

  if (error) throw error;
  return syncDispatchRows(client, "rides", (data ?? []) as RideWithRiderRow[], "ride");
}

async function liveParcels(
  client: AdminClient,
  userId: string,
): Promise<ParcelWithCourierRow[]> {
  const { data, error } = await client
    .from("parcels")
    .select("*, drivers(*)")
    .eq("user_id", userId)
    .order("requested_at", { ascending: false });

  if (error) throw error;
  return syncDispatchRows(client, "parcels", (data ?? []) as ParcelWithCourierRow[], "parcel");
}

/** The ledger: every commitment, newest first. */
async function liveBookings(client: AdminClient, userId: string): Promise<Booking[]> {
  const [ticketRows, rideRows, parcelRows, orderRows] = await Promise.all([
    client
      .from("tickets")
      .select("*, events(*), event_tiers(price)")
      .eq("user_id", userId),
    client
      .from("rides")
      .select("*, drivers(*), ride_classes(name)")
      .eq("user_id", userId),
    client
      .from("parcels")
      .select("*, drivers(*)")
      .eq("user_id", userId),
    client
      .from("orders")
      .select("*, restaurants(*), drivers(*), order_lines(*)")
      .eq("user_id", userId),
  ]);

  if (ticketRows.error) throw ticketRows.error;
  if (rideRows.error) throw rideRows.error;
  if (parcelRows.error) throw parcelRows.error;
  if (orderRows.error) throw orderRows.error;

  const tickets = (ticketRows.data ?? []) as (TicketRow & {
    events: EventRow | null;
    event_tiers: { price: number } | null;
  })[];
  const rides = (rideRows.data ?? []) as RideWithRiderRow[];
  const parcels = (parcelRows.data ?? []) as ParcelWithCourierRow[];
  const orders = (orderRows.data ?? []) as OrderWithLinesRow[];

  const fromTickets: Booking[] = tickets.map((ticket) => {
    const event = ticket.events;
    const lines = event ? `${event.venue}, ${event.neighbourhood}` : "";

    return {
      id: ticket.id,
      kind: "ticket",
      title: event?.title ?? "Event",
      subtitle: `${ticket.tier_name} × ${ticket.quantity}`,
      status: TICKET_STATUS[ticket.status] ?? "confirmed",
      when: event ? eventStart(event.event_date, event.start_time) : ticket.purchased_at,
      price: (ticket.event_tiers?.price ?? 0) * ticket.quantity,
      reference: ticket.reference,
      image: event
        ? { src: event.image_src, alt: event.image_alt }
        : { src: "", alt: "The event" },
      details: [
        lines,
        event ? `Doors ${doorsTime(event.start_time)}` : "",
        `Show ${ticket.reference}`,
      ].filter(Boolean),
      href: `/tickets/${ticket.id}`,
    };
  });

  const fromRides: Booking[] = rides.map((ride) => ({
    id: ride.id,
    kind: "ride",
    title: `${ride.ride_classes?.name ?? "Taxi"} to ${ride.dropoff}`,
    subtitle: `${ride.pickup}, ${ride.pickup_area.split(",")[0]} → ${ride.dropoff}`,
    status: bookingStatus(ride.status),
    when: ride.scheduled_for ?? ride.requested_at,
    price: ride.price,
    reference: ride.reference,
    image: { src: "/assets/images/ride-driver-pov.jpg", alt: "A driver's hands on the steering wheel at dusk" },
    details: [
      ride.drivers ? `${ride.drivers.vehicle} ${ride.drivers.plate}` : "",
      `${ride.distance_km} km · ${ride.duration_minutes} min`,
      ride.passengers > 1 ? `${ride.passengers} passengers` : "",
      ride.drivers ? `${ride.drivers.name} · ${ride.drivers.rating}` : "",
    ].filter(Boolean),
    href: `/rides/${ride.id}`,
  }));

  const fromParcels: Booking[] = parcels.map((parcel) => ({
    id: parcel.id,
    kind: "parcel",
    title:
      parcel.quantity > 1
        ? `${parcel.quantity} × ${parcel.parcel_type}`
        : parcel.parcel_type,
    subtitle: `${parcel.pickup} → ${parcel.dropoff}`,
    status: bookingStatus(parcel.status),
    when: parcel.scheduled_for ?? parcel.requested_at,
    price: parcel.price,
    reference: parcel.tracking_number,
    image: {
      src: "/assets/images/ride-bike-sunset.jpg",
      alt: "A motorcyclist riding at sunset on an open road",
    },
    details: [
      parcel.recipient_name ? `For ${parcel.recipient_name}` : "",
      parcel.recipient_phone,
      parcel.scheduled_for ? "Scheduled collection" : "",
    ].filter(Boolean),
    href: `/parcels/${parcel.id}`,
  }));

  const fromOrders: Booking[] = orders.map((order) => {
    const lines = order.order_lines ?? [];
    const last = lines[lines.length - 1];

    return {
      id: order.id,
      kind: "order",
      title: order.restaurants?.name ?? "Your order",
      subtitle: lines[0]?.name ?? order.address,
      status: ORDER_STATUS[order.status] ?? "pending",
      when: order.placed_at,
      price: order.subtotal + order.delivery_fee,
      reference: order.reference,
      image: order.restaurants
        ? { src: order.restaurants.image_src, alt: order.restaurants.image_alt }
        : { src: "", alt: "Your order" },
      details: [
        last ? `${lines.length} items • ${last.name} × ${last.quantity}` : "",
        order.address,
        order.drivers ? `${order.drivers.name.split(" ")[0]} is riding to you` : "A rider is being assigned",
      ].filter(Boolean),
      href: `/orders/${order.id}`,
    };
  });

  return [...fromTickets, ...fromRides, ...fromParcels, ...fromOrders].sort((a, b) =>
    b.when.localeCompare(a.when),
  );
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export async function listEvents(): Promise<Event[]> {
  const client = createAdminClient();
  if (!client) return events;
  return liveEvents(client);
}

export async function getEventBySlug(slug: string): Promise<Event | undefined> {
  const client = createAdminClient();
  if (!client) return events.find((event) => event.slug === slug);

  const { data, error } = await client
    .from("events")
    .select("*, event_tiers(*)")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return undefined;

  const row = data as EventWithTiersRow;
  return toEvent({ ...row, tiers: row.event_tiers ?? [] });
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const client = createAdminClient();
  if (!client) return events.find((event) => event.id === id);

  const { data, error } = await client
    .from("events")
    .select("*, event_tiers(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return undefined;

  const row = data as EventWithTiersRow;
  return toEvent({ ...row, tiers: row.event_tiers ?? [] });
}

/** The event the Events screen leads with. */
export async function getFeaturedEvent(): Promise<Event | undefined> {
  const client = createAdminClient();
  if (!client) return events.find((event) => event.featured) ?? events[0];

  const { data, error } = await client
    .from("events")
    .select("*, event_tiers(*)")
    .eq("featured", true)
    .order("event_date", { ascending: true })
    .limit(1);

  if (error) throw error;

  const row = (data ?? [])[0] as EventWithTiersRow | undefined;
  if (!row) return undefined;
  return toEvent({ ...row, tiers: row.event_tiers ?? [] });
}

/** Soonest first, featured events included. */
export async function getUpcomingEvents(): Promise<Event[]> {
  const client = createAdminClient();
  if (!client) {
    return [...events]
      .filter((event) => event.date >= DEMO_TODAY)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  const { data, error } = await client
    .from("events")
    .select("*, event_tiers(*)")
    .gte("event_date", DEMO_TODAY)
    .order("event_date", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as EventWithTiersRow[]).map((row) =>
    toEvent({ ...row, tiers: row.event_tiers ?? [] }),
  );
}

/** Trending events, most-booked first. */
export async function getTrendingEvents(limit = 4): Promise<Event[]> {
  const client = createAdminClient();
  if (!client) {
    return events
      .filter((event) => event.trending)
      .sort((a, b) => b.going - a.going)
      .slice(0, limit);
  }

  const { data, error } = await client
    .from("events")
    .select("*, event_tiers(*)")
    .eq("trending", true)
    .order("going", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return ((data ?? []) as EventWithTiersRow[]).map((row) =>
    toEvent({ ...row, tiers: row.event_tiers ?? [] }),
  );
}

export async function listRestaurants(): Promise<Restaurant[]> {
  const client = createAdminClient();
  if (!client) return restaurants;
  return liveRestaurants(client);
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | undefined> {
  const client = createAdminClient();
  if (!client) return restaurants.find((restaurant) => restaurant.slug === slug);

  const { data, error } = await client
    .from("restaurants")
    .select("*, menu_items(*, menu_item_sizes(*), menu_item_toppings(*))")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return undefined;

  return toRestaurant(toRestaurantRecord(data as RestaurantWithMenuRow));
}

/** Restaurants ordered by how much Flash is moving them this week. */
export async function getTrendingRestaurants(limit = 4): Promise<Restaurant[]> {
  const all = await listRestaurants();
  return [...all]
    .sort((a, b) => b.ratingCount * b.rating - a.ratingCount * a.rating)
    .slice(0, limit);
}

/**
 * The quote the Ride screen opens with.
 *
 * The distance and duration are still the demo route — Flash has no maps yet —
 * but the classes and their fares come from the database.
 */
export async function getRideQuote(): Promise<RideQuote> {
  const client = createAdminClient();
  if (!client) return { ...rideQuote, classes: rideClasses };

  const { data, error } = await client
    .from("ride_classes")
    .select("*")
    .order("position", { ascending: true });

  if (error) throw error;

  return { ...rideQuote, classes: ((data ?? []) as RideClassRow[]).map(toRideClass) };
}

export async function getSavedPlaces(): Promise<SavedPlace[]> {
  const client = createAdminClient();
  if (!client) return accountStore.savedPlaces ?? [];

  const userId = await currentUserId();
  if (!userId) return [];

  const { data, error } = await client
    .from("saved_places")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as SavedPlaceRow[]).map((row) => ({
    id: row.id,
    label: row.label,
    detail: row.detail,
  }));
}

export async function listTickets(): Promise<Ticket[]> {
  const client = createAdminClient();
  if (!client) return [];

  const userId = await currentUserId();
  if (!userId) return [];
  return liveTickets(client, userId);
}

/**
 * Sold-out requests. With no database, demo requests come from the in-memory
 * store so planner and admin screens have something to show.
 */
export async function listTicketRequests(eventIds?: string[]): Promise<TicketRequest[]> {
  const client = createAdminClient();
  if (!client) return demoTicketRequests();

  let query = client
    .from("ticket_requests")
    .select("*, events(title), event_tiers(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (eventIds?.length) query = query.in("event_id", eventIds);

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as (TicketRequestRow & {
    events: { title: string } | null;
    event_tiers: { name: string } | null;
  })[]).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    tierId: row.tier_id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    quantity: row.quantity,
    status: row.status as TicketRequest["status"],
    note: row.note,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
    eventTitle: row.events?.title,
    tierName: row.event_tiers?.name,
  }));
}

/** The signed-in customer's payment history, newest first. */
export async function listUserPayments(): Promise<
  {
    id: string;
    reference: string;
    kind: string;
    provider: string;
    status: string;
    amount: number;
    createdAt: string;
  }[]
> {
  const client = createAdminClient();
  if (!client) return [];

  const userId = await currentUserId();
  if (!userId) return [];

  const { data, error } = await client
    .from("payments")
    .select("id, reference, kind, provider, status, amount_pesewas, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    reference: row.reference,
    kind: row.kind,
    provider: row.provider,
    status: row.status,
    amount: row.amount_pesewas / 100,
    createdAt: row.created_at,
  }));
}

export async function listBookings(): Promise<Booking[]> {
  const client = createAdminClient();
  if (!client) return [];

  const userId = await currentUserId();
  if (!userId) return [];
  return liveBookings(client, userId);
}

export async function getActiveOrder(): Promise<Order | undefined> {
  const client = createAdminClient();
  if (!client) return undefined;

  const userId = await currentUserId();
  if (!userId) return undefined;

  const rows = await liveOrders(client, userId);
  const active = rows.find((row) => row.status !== "delivered");
  return active ? toOrder(active) : undefined;
}

export async function getCurrentUser(): Promise<FlashUser> {
  const client = createAdminClient();
  if (!client) {
    return {
      ...user,
      id: "guest",
      name: "Customer",
      email: "",
      avatarUrl: "",
      memberSince: "",
      ...(accountStore.profile ?? {}),
    };
  }

  const userId = await currentUserId();
  if (!userId) return user;
  return liveProfile(client, userId);
}

/**
 * The businesses the signed-in account runs.
 *
 * A kitchen owner gets a storefront to look after: the cover, the poster, the
 * offer. This reads the kitchens whose owner is the signed-in customer.
 */
export async function listMyKitchens(): Promise<Restaurant[]> {
  const client = createAdminClient();
  if (!client) {
    return restaurants.filter((restaurant) => restaurant.ownerId);
  }

  const userId = await currentUserId();
  if (!userId) return [];

  const { data, error } = await client
    .from("restaurants")
    .select("*, menu_items(*, menu_item_sizes(*), menu_item_toppings(*))")
    .eq("owner_user_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as RestaurantWithMenuRow[]).map((row) =>
    toRestaurant(toRestaurantRecord(row)),
  );
}

/**
 * The one kitchen a business runs, when it has one.
 *
 * The console opens for a business even before its venue exists, so callers
 * treat a missing row as "finish setup", not as a foreign business.
 */
export async function listKitchen(businessId: string): Promise<Restaurant | undefined> {
  const client = createAdminClient();
  if (!client) {
    return restaurants.find((restaurant) => restaurant.businessId === businessId);
  }

  const userId = await currentUserId();
  if (!userId) return undefined;

  const { data, error } = await client
    .from("restaurants")
    .select("*, menu_items(*, menu_item_sizes(*), menu_item_toppings(*))")
    .eq("business_id", businessId)
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? toRestaurant(toRestaurantRecord(data as RestaurantWithMenuRow)) : undefined;
}

/* -------------------------------------------------------------------------- */
/* The business side                                                           */
/* -------------------------------------------------------------------------- */

function toBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind as Business["kind"],
    name: row.name,
    email: row.email,
    phone: row.phone,
    neighbourhood: row.neighbourhood,
    about: row.about,
    status: row.status as Business["status"],
    createdAt: row.created_at,
    decidedAt: row.decided_at ?? undefined,
  };
}

/** Every business the signed-in account has applied for or runs. */
export async function listBusinesses(): Promise<Business[]> {
  const client = createAdminClient();
  if (!client) return businesses;

  const userId = await currentUserId();
  if (!userId) return [];

  const { data, error } = await client
    .from("businesses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as BusinessRow[]).map(toBusiness);
}

/**
 * One owned business by id and kind.
 *
 * Routes and actions share this gate. `listBusinesses()` already scopes its
 * result to the signed-in customer, so a business of another account — or of
 * the wrong kind — simply is not here and the caller treats it as missing.
 */
export async function getOwnedBusiness(
  businessId: string,
  kind: "restaurant" | "events",
): Promise<Business | undefined> {
  const businesses = await listBusinesses();
  return businesses.find((business) => business.id === businessId && business.kind === kind);
}

/** The approved business of a kind, when the account has one. */
export async function getApprovedBusiness(
  kind: Business["kind"],
): Promise<Business | undefined> {
  const businesses = await listBusinesses();
  return businesses.find((business) => business.kind === kind && business.status === "approved");
}

/**
 * True when the signed-in account runs a business.
 *
 * A business browses like anybody else but does not order: the kitchen's own
 * tables are not its customers. The demo account is a customer first, so the
 * fixtures never trip this — the rule only bites on the live path.
 */
export async function isBusinessAccount(): Promise<boolean> {
  const role = await currentRole();
  if (canManageBusiness(role)) return true;

  const client = createAdminClient();
  if (!client) return false;

  const userId = await currentUserId();
  if (!userId) return false;

  const { data, error } = await client
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "approved")
    .limit(1);

  if (error) throw error;
  return (data ?? []).length > 0;
}

/** The events the signed-in account promotes. */
export async function listMyEvents(): Promise<Event[]> {
  const client = createAdminClient();
  if (!client) return events.filter((event) => event.ownerId === DEMO_USER_ID);

  const userId = await currentUserId();
  if (!userId) return [];

  const { data, error } = await client
    .from("events")
    .select("*, event_tiers(*)")
    .eq("owner_user_id", userId)
    .order("event_date", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as EventWithTiersRow[]).map((row) =>
    toEvent({ ...row, tiers: row.event_tiers ?? [] }),
  );
}

/** The events one business promotes, not the whole account's. */
export async function listEventsForBusiness(businessId: string): Promise<Event[]> {
  const client = createAdminClient();
  if (!client) return events.filter((event) => event.businessId === businessId);

  const userId = await currentUserId();
  if (!userId) return [];

  const { data, error } = await client
    .from("events")
    .select("*, event_tiers(*)")
    .eq("business_id", businessId)
    .eq("owner_user_id", userId)
    .order("event_date", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as EventWithTiersRow[]).map((row) =>
    toEvent({ ...row, tiers: row.event_tiers ?? [] }),
  );
}

/** The orders a kitchen has to deal with. */
export async function listIncomingOrders(restaurantId: string): Promise<Order[]> {
  const client = createAdminClient();
  if (!client) {
    return incomingOrders.filter((order) => order.restaurantId === restaurantId);
  }

  const { data, error } = await client
    .from("orders")
    .select("*, restaurants(*), drivers(*), order_lines(*)")
    .eq("restaurant_id", restaurantId)
    .neq("status", "delivered")
    .order("placed_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as OrderWithLinesRow[]).map(toOrder);
}

/** The tickets an event manager has to confirm. */
export async function listIncomingTickets(eventIds: string[]): Promise<Ticket[]> {
  const client = createAdminClient();
  if (!client) {
    return incomingTickets.filter((ticket) => eventIds.includes(ticket.eventId));
  }

  if (eventIds.length === 0) return [];

  const { data, error } = await client
    .from("tickets")
    .select("*")
    .in("event_id", eventIds)
    .order("purchased_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as TicketRow[]).map(toTicket);
}

/** A person who has bought from one of the account's businesses. */
export type ConsoleCustomer = {
  id: string;
  name: string;
  email: string;
  orders: number;
  tickets: number;
  spend: number;
};

/** The demo people behind the seeded orders and tickets. */
const DEMO_CUSTOMERS = [
  { id: "usr-kofi-mensah", name: "Kofi Mensah", email: "kofi@example.gh" },
  { id: "usr-efua-ansah", name: "Efua Ansah", email: "efua@example.gh" },
  { id: "usr-ama-boateng", name: "Ama Boateng", email: "ama@example.gh" },
  { id: "usr-yaw-opoku", name: "Yaw Opoku", email: "yaw@example.gh" },
  { id: "usr-naa-dzifa", name: "Naa Dzifa", email: "naa@example.gh" },
];

/**
 * The customers of one business, aggregated from the orders or tickets that
 * belong to its venues. The service role bypasses RLS, so the venue ids are
 * already resolved from the owned business before this read runs.
 */
export async function listCustomers(
  businessId: string,
  kind: "restaurant" | "events",
): Promise<ConsoleCustomer[]> {
  const client = createAdminClient();

  if (!client) {
    const kitchen = restaurants.find((entry) => entry.businessId === businessId);
    const ownedEvents = events.filter((entry) => entry.businessId === businessId);
    const totals = new Map<string, ConsoleCustomer>();

    const add = (index: number, orders: number, tickets: number, spend: number) => {
      const person = DEMO_CUSTOMERS[index % DEMO_CUSTOMERS.length];
      const row = totals.get(person.id) ?? { ...person, orders: 0, tickets: 0, spend: 0 };
      row.orders += orders;
      row.tickets += tickets;
      row.spend += spend;
      totals.set(person.id, row);
    };

    if (kind === "restaurant" && kitchen) {
      incomingOrders
        .filter((order) => order.restaurantId === kitchen.id)
        .forEach((order, index) => add(index, 1, 0, order.subtotal - order.discount));
    } else {
      incomingTickets
        .filter((ticket) => ownedEvents.some((entry) => entry.id === ticket.eventId))
        .forEach((ticket, index) => {
          const event = ownedEvents.find((entry) => entry.id === ticket.eventId);
          const tier = event?.tiers.find((entry) => entry.id === ticket.tierId);
          add(index, 0, ticket.quantity, (tier?.price ?? 0) * ticket.quantity);
        });
    }

    return [...totals.values()];
  }

  const readPurchases = async () => {
    if (kind === "restaurant") {
      const kitchen = await listKitchen(businessId);
      if (!kitchen) return [];
      const result = await client
        .from("orders")
        .select("user_id, subtotal, discount")
        .eq("restaurant_id", kitchen.id);
      if (result.error) throw result.error;
      return result.data ?? [];
    }

    const eventIds = (await listEventsForBusiness(businessId)).map((entry) => entry.id);
    if (!eventIds.length) return [];
    const result = await client
      .from("tickets")
      .select("user_id, quantity, tier_id")
      .in("event_id", eventIds);
    if (result.error) throw result.error;
    return result.data ?? [];
  };

  type PurchaseRow = {
    user_id: string;
    subtotal?: number;
    discount?: number;
    quantity?: number;
    tier_id?: string | null;
  };
  const purchases = (await readPurchases()) as PurchaseRow[];
  const ids = [...new Set(purchases.map((row) => row.user_id).filter(Boolean))];
  if (!ids.length) return [];

  const { data: profiles, error: profileError } = await client
    .from("profiles")
    .select("id, name, email")
    .in("id", ids);

  if (profileError) throw profileError;

  const byId = new Map((profiles ?? []).map((row) => [row.id, row]));
  const totals = new Map<string, ConsoleCustomer>();

  for (const row of purchases) {
    const profile = byId.get(row.user_id as string);
    if (!profile) continue;

    const entry = totals.get(profile.id) ?? {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      orders: 0,
      tickets: 0,
      spend: 0,
    };

    if (kind === "restaurant") {
      entry.orders += 1;
      entry.spend += Number(row.subtotal ?? 0) - Number(row.discount ?? 0);
    } else {
      entry.tickets += Number(row.quantity ?? 0);
      entry.spend += Number(row.quantity ?? 0);
    }
    totals.set(profile.id, entry);
  }

  return [...totals.values()];
}

/* -------------------------------------------------------------------------- */
/* Deliveries                                                                  */
/* -------------------------------------------------------------------------- */

/** Everything of the customer's that is still moving. */
export async function listDeliveries(): Promise<Delivery[]> {
  const client = createAdminClient();
  if (!client) return [];

  const userId = await currentUserId();
  if (!userId) return [];

  const [orderRows, rideRows, parcelRows] = await Promise.all([
    liveOrders(client, userId),
    liveRides(client, userId),
    liveParcels(client, userId),
  ]);

  return [
    ...orderRows
      .filter((row) => row.status !== "delivered")
      .map(orderToDelivery),
    ...rideRows
      .filter((row) => !isDispatchTerminal(row.dispatch_task_status ?? row.status))
      .map(rideToDelivery),
    ...parcelRows
      .filter((row) => !isDispatchTerminal(row.dispatch_task_status ?? row.status))
      .map(parcelToDelivery),
  ];
}

/** Everything that has already arrived. */
export async function listPastDeliveries(): Promise<PastDelivery[]> {
  const client = createAdminClient();
  if (!client) return [];

  const userId = await currentUserId();
  if (!userId) return [];

  const [orderRows, rideRows, parcelRows] = await Promise.all([
    liveOrders(client, userId),
    liveRides(client, userId),
    liveParcels(client, userId),
  ]);

  return [
    ...orderRows.filter((row) => row.status === "delivered").map(orderToPastDelivery),
    ...rideRows.filter((row) => canonicalState(row.dispatch_task_status ?? row.status) === "delivered").map(rideToPastDelivery),
    ...parcelRows.filter((row) => canonicalState(row.dispatch_task_status ?? row.status) === "delivered").map(parcelToPastDelivery),
  ].sort((a, b) => b.when.localeCompare(a.when));
}

/** One delivery, for its own screen. */
export async function getDelivery(id: string): Promise<Delivery | undefined> {
  const client = createAdminClient();
  if (!client) return undefined;

  const userId = await currentUserId();
  if (!userId) return undefined;

  const [orderRows, rideRows, parcelRows] = await Promise.all([
    liveOrders(client, userId),
    liveRides(client, userId),
    liveParcels(client, userId),
  ]);

  const order = orderRows.find((row) => row.id === id);
  if (order) return orderToDelivery(order);

  const ride = rideRows.find((row) => row.id === id);
  if (ride) return rideToDelivery(ride);

  const parcel = parcelRows.find((row) => row.id === id);
  if (parcel) return parcelToDelivery(parcel);

  return undefined;
}
