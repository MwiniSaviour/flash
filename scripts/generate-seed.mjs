/**
 * Generates `supabase/seed.sql` from the demo fixtures.
 *
 * The fixtures in `src/lib/flash/data` are the demo dataset: the events, the
 * kitchens, the menus, the ticket wallet, the orders and the live deliveries.
 * The database has to hold the same story, so the seed is generated from those
 * files instead of being maintained by hand — change a fixture, re-run this,
 * and the database follows.
 *
 *   npm run db:seed
 *
 * The output is deterministic: the same fixtures always produce the same SQL,
 * so the seed diffs cleanly.
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { events } from "../src/lib/flash/data/events.ts";
import { restaurants } from "../src/lib/flash/data/food.ts";
import { rideClasses, rideQuote, savedPlaces, drivers } from "../src/lib/flash/data/rides.ts";
import { parcelQuote } from "../src/lib/flash/data/parcels.ts";
import { user, tickets, activeOrder, bookings } from "../src/lib/flash/data/account.ts";
import { deliveries, pastDeliveries } from "../src/lib/flash/data/tracking.ts";

const DEMO_USER = user.id;
const DEMO_YEAR = 2026;

/** Fallback clock for rows the fixtures never timestamp. */
const FALLBACK_INSTANT = "2026-11-15T12:00:00.000Z";

/** Past deliveries that were rides need a row id the fixtures do not carry. */
const PAST_RIDE_IDS = { "past-2": "ride-5490" };

// ---------------------------------------------------------------------------
// SQL literals
// ---------------------------------------------------------------------------

const t = (value) => (value === null || value === undefined ? "null" : `'${String(value).replace(/'/g, "''")}'`);
const n = (value) => (value === null || value === undefined ? "null" : String(value));
const b = (value) => (value === null || value === undefined ? "null" : value ? "true" : "false");
const d = (value) => (value === null || value === undefined ? "null" : `'${value}'`);
const tm = (value) => (value === null || value === undefined ? "null" : `'${value}'`);
const ts = (value) =>
  value === null || value === undefined ? "null" : `'${new Date(value).toISOString()}'`;
const arr = (values) => {
  if (!values || values.length === 0) return "'{}'";
  return `'{${values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")}}'`;
};

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

const driverRows = drivers.map((driver) => ({ ...driver }));

/** A courier who only appears on a delivery card is still a driver. */
function driverIdFor(name) {
  const known = driverRows.find((driver) => driver.name === name);
  if (known) return known.id;
  const courier = deliveries.find((delivery) => delivery.rider.name === name);
  if (!courier) return null;
  const id = `drv-${name.toLowerCase().split(" ").join("-")}`;
  driverRows.push({
    id,
    name,
    rating: 4.9,
    photo: courier.rider.photo,
    plate: courier.rider.plate,
    vehicle: courier.rider.vehicle,
    completedRides: 0,
  });
  return id;
}

function driverIdForPlate(plate) {
  const known = driverRows.find((driver) => driver.plate === plate);
  return known ? known.id : null;
}

function menuItemIdFor(name) {
  for (const restaurant of restaurants) {
    const item = restaurant.menu.find((entry) => entry.name.toLowerCase() === String(name).toLowerCase());
    if (item) return item.id;
  }
  return null;
}

function rideClassIdFor(title) {
  const match = rideClasses.find((entry) => title.startsWith(entry.name));
  return match ? match.id : null;
}

const ACCRA_AREAS = {
  Osu: "Osu, Accra",
  Ridge: "Ridge, Accra",
  Labadi: "Labadi, Accra",
  "East Legon": "East Legon, Accra",
  "Airport Residential": "Airport Residential, Accra",
};

const areaFor = (area) => ACCRA_AREAS[area] ?? `${area}, Accra`;

/** "Thu 12 Nov" (fixture copy) to an ISO instant on the demo clock. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function isoFromDayMonth(label) {
  const match = /^(\w{3})\s+(\d{1,2})\s+(\w{3})$/.exec(label ?? "");
  if (!match) return FALLBACK_INSTANT;
  const month = MONTHS.indexOf(match[3]);
  return `${DEMO_YEAR}-${String(month + 1).padStart(2, "0")}-${String(Number(match[2])).padStart(2, "0")}T12:00:00.000Z`;
}

const minutesIn = (text) => {
  const match = /(\d+)\s*min/.exec(text ?? "");
  return match ? Number(match[1]) : 0;
};

const orderIdFor = (booking) => `ord-${booking.id.split("-").pop()}`;
const rideIdFor = (booking) => `ride-${booking.id.split("-").pop()}`;

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

const profileRows = [
  {
    id: DEMO_USER,
    name: user.name,
    email: user.email,
    avatar_src: user.avatarUrl,
    avatar_alt: `Portrait of ${user.name}, the signed-in customer`,
    member_since: user.memberSince,
    notifications_enabled: user.notificationsEnabled,
  },
];

/**
 * The demo's business console needs customers other than the signed-in one —
 * an order only means something if somebody else placed it. These are the
 * neighbours who order from the demo kitchen and the demo promoter's events.
 */
const OTHER_CUSTOMERS = [
  {
    id: "usr-kofi-mensah",
    name: "Kofi Mensah",
    email: "kofi@example.gh",
    avatar_src: "/assets/images/avatar-david-kuunyoo.jpg",
    avatar_alt: "Portrait of Kofi Mensah, a customer of the demo kitchen",
  },
  {
    id: "usr-efua-danquah",
    name: "Efua Danquah",
    email: "efua@example.gh",
    avatar_src: "/assets/images/avatar-fatima-ba-nyagse.jpg",
    avatar_alt: "Portrait of Efua Danquah, a customer of the demo kitchen",
  },
  {
    id: "usr-ama-nkrumah",
    name: "Ama Nkrumah",
    email: "ama@example.gh",
    avatar_src: "/assets/images/avatar-solomon-geyidonyah.jpg",
    avatar_alt: "Portrait of Ama Nkrumah, a customer of the demo kitchen",
  },
];

for (const customer of OTHER_CUSTOMERS) {
  profileRows.push({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    avatar_src: customer.avatar_src,
    avatar_alt: customer.avatar_alt,
    member_since: "June 2025",
    notifications_enabled: true,
  });
}

/** The businesses the demo account runs. */
const businessRows = [
  {
    id: "biz-auntie-muni",
    user_id: DEMO_USER,
    kind: "restaurant",
    name: "Auntie Muni's Kitchen",
    email: "orders@auntiemunis.example.gh",
    phone: "+233 24 555 0142",
    neighbourhood: "Osu",
    about: "Ghanaian home cooking out of Osu, packed to travel.",
    status: "approved",
  },
  {
    id: "biz-urban-vibes",
    user_id: DEMO_USER,
    kind: "events",
    name: "Urban Vibes Festival",
    email: "crew@urbanvibes.example.gh",
    phone: "+233 20 888 0917",
    neighbourhood: "Cantonments",
    about: "Two stages, a food market and a design fair at the Trade Fair Centre.",
    status: "approved",
  },
];

const eventRows = events.map((event) => ({
  id: event.id,
  slug: event.slug,
  title: event.title,
  subtitle: event.subtitle,
  description: event.description,
  venue: event.venue,
  neighbourhood: event.neighbourhood,
  city: event.city,
  distance_km: event.distanceKm,
  event_date: event.date,
  start_time: event.startTime,
  end_time: event.endTime,
  image_src: event.image.src,
  image_alt: event.image.alt,
  categories: event.categories,
  featured: event.featured,
  trending: event.trending,
  live: event.live,
  price_from: event.priceFrom,
  going: event.going,
  capacity: event.capacity,
  owner_user_id: event.id === "evt-urban-vibes-festival" ? DEMO_USER : null,
  discount_percent: event.id === "evt-urban-vibes-festival" ? 10 : 0,
}));

const tierRows = events.flatMap((event) =>
  event.tiers.map((tier) => ({
    id: tier.id,
    event_id: event.id,
    name: tier.name,
    description: tier.description,
    price: tier.price,
    perks: tier.perks,
    available: tier.available,
  })),
);

const ticketRows = tickets.map((ticket) => ({
  id: ticket.id,
  user_id: DEMO_USER,
  event_id: ticket.eventId,
  tier_id: ticket.tierId,
  tier_name: ticket.tierName,
  quantity: ticket.quantity,
  status: ticket.status,
  reference: ticket.reference,
  purchased_at: ticket.purchasedAt,
}));

/**
 * Tickets sold to the demo promoter's event by other people — the incoming
 * orders the event console has to confirm.
 */
ticketRows.push(
  {
    id: "tkt-uv-kofi",
    user_id: "usr-kofi-mensah",
    event_id: "evt-urban-vibes-festival",
    tier_id: "tier-urban-ga",
    tier_name: "General Admission",
    quantity: 2,
    status: "pending",
    reference: "FLS-8801-1120",
    purchased_at: "2026-11-15T19:12:00.000Z",
  },
  {
    id: "tkt-uv-efua",
    user_id: "usr-efua-danquah",
    event_id: "evt-urban-vibes-festival",
    tier_id: "tier-urban-vip",
    tier_name: "VIP Experience",
    quantity: 1,
    status: "pending",
    reference: "FLS-8802-1130",
    purchased_at: "2026-11-15T20:03:00.000Z",
  },
  {
    id: "tkt-uv-ama",
    user_id: "usr-ama-nkrumah",
    event_id: "evt-urban-vibes-festival",
    tier_id: "tier-urban-ga",
    tier_name: "General Admission",
    quantity: 4,
    status: "confirmed",
    reference: "FLS-8803-1140",
    purchased_at: "2026-11-16T07:40:00.000Z",
  },
);

const restaurantRows = restaurants.map((restaurant) => ({
  id: restaurant.id,
  slug: restaurant.slug,
  name: restaurant.name,
  tagline: restaurant.tagline,
  cuisine: restaurant.cuisine,
  neighbourhood: restaurant.neighbourhood,
  rating: restaurant.rating,
  rating_count: restaurant.ratingCount,
  delivery_fee: restaurant.deliveryFee,
  eta_minutes: restaurant.etaMinutes,
  distance_km: restaurant.distanceKm,
  badge: restaurant.badge ?? null,
  discount_percent: restaurant.discount?.percent ?? 0,
  owner_user_id: restaurant.ownerId ?? null,
  image_src: restaurant.image.src,
  image_alt: restaurant.image.alt,
}));

const menuRows = restaurants.flatMap((restaurant) =>
  restaurant.menu.map((item) => ({
    id: item.id,
    restaurant_id: restaurant.id,
    name: item.name,
    description: item.description,
    tagline: item.tagline,
    price: item.price,
    image_src: item.image.src,
    image_alt: item.image.alt,
    popular: item.popular,
    vegetarian: item.vegetarian,
  })),
);

const sizeRows = restaurants.flatMap((restaurant) =>
  restaurant.menu.flatMap((item) =>
    item.sizes.map((size, index) => ({
      id: `${item.id}-${size.id}`,
      menu_item_id: item.id,
      name: size.name,
      price: size.price,
      position: index + 1,
    })),
  ),
);

const toppingRows = restaurants.flatMap((restaurant) =>
  restaurant.menu.flatMap((item) =>
    item.toppings.map((topping, index) => ({
      id: `${item.id}-${topping.id}`,
      menu_item_id: item.id,
      name: topping.name,
      price: topping.price,
      position: index + 1,
    })),
  ),
);

const rideClassRows = rideClasses.map((entry, index) => ({
  id: entry.id,
  name: entry.name,
  description: entry.description,
  seats: entry.seats,
  eta_minutes: entry.etaMinutes,
  price: entry.price,
  perk: entry.perk,
  position: index + 1,
}));

const savedPlaceRows = savedPlaces.map((place, index) => ({
  user_id: DEMO_USER,
  id: place.id,
  label: place.label,
  detail: place.detail,
  position: index + 1,
}));

// -- orders -----------------------------------------------------------------

const orderRows = [];
const orderLineRows = [];
const seenOrderIds = new Set();

for (const delivery of deliveries.filter((entry) => entry.kind === "order")) {
  const restaurant = restaurants.find((entry) => entry.name === delivery.title);
  const receipt = delivery.receipt;
  const active = activeOrder?.id === delivery.id ? activeOrder : null;
  seenOrderIds.add(delivery.id);

  orderRows.push({
    id: delivery.id,
    user_id: DEMO_USER,
    restaurant_id: restaurant?.id ?? active?.restaurantId ?? null,
    rider_id: driverIdFor(delivery.rider.name),
    number: delivery.number,
    fulfilment: "delivery",
    status: delivery.status,
    subtotal: receipt?.subtotal ?? 0,
    discount: 0,
    delivery_fee: receipt?.deliveryFee ?? 0,
    address: receipt?.address ?? `${delivery.to}, ${(delivery.toPlace ?? "").split(",")[0].trim()}`,
    eta_minutes: minutesIn(delivery.eta),
    reference: delivery.reference,
    placed_at: active?.placedAt ?? FALLBACK_INSTANT,
  });

  (receipt?.lines ?? []).forEach((line, index) => {
    orderLineRows.push({
      id: `ol-${delivery.id}-${index + 1}`,
      order_id: delivery.id,
      menu_item_id: menuItemIdFor(line.name),
      name: line.name,
      size: "Regular",
      toppings: [],
      quantity: line.quantity,
      price: line.price,
    });
  });
}

// Orders the ledger remembers but no delivery card follows.
for (const booking of bookings.filter((entry) => entry.kind === "order")) {
  const id = orderIdFor(booking);
  if (seenOrderIds.has(id)) continue;
  seenOrderIds.add(id);

  const restaurant = restaurants.find((entry) => entry.name === booking.title);
  orderRows.push({
    id,
    user_id: DEMO_USER,
    restaurant_id: restaurant?.id ?? null,
    rider_id: null,
    number: id.split("-").pop(),
    fulfilment: "delivery",
    status: booking.status === "completed" ? "delivered" : "preparing",
    subtotal: booking.price,
    discount: 0,
    delivery_fee: 0,
    address: booking.details?.[1] ?? "",
    eta_minutes: minutesIn(booking.details?.join(" ") ?? ""),
    reference: booking.reference,
    placed_at: booking.when,
  });
  orderLineRows.push({
    id: `ol-${id}-1`,
    order_id: id,
    menu_item_id: menuItemIdFor(booking.subtitle),
    name: booking.subtitle,
    size: "Regular",
    toppings: [],
    quantity: 1,
    price: booking.price,
  });
}

/**
 * The orders waiting on the demo kitchen — placed by other people, so the
 * restaurant console has something to confirm.
 */
const INCOMING_ORDERS = [
  {
    id: "ord-8801",
    user_id: "usr-kofi-mensah",
    number: "88014410",
    reference: "FLS-8801-4410",
    status: "awaiting confirmation",
    fulfilment: "delivery",
    address: "12 Fifth Street, Ridge",
    eta_minutes: 30,
    placed_at: "2026-11-15T18:05:00.000Z",
    lines: [{ menu_item_id: "mi-muni-jollof", name: "Party jollof & grilled chicken", quantity: 2, price: 45 }],
  },
  {
    id: "ord-8802",
    user_id: "usr-efua-danquah",
    number: "88025512",
    reference: "FLS-8802-5512",
    status: "preparing",
    fulfilment: "pickup",
    address: "",
    eta_minutes: 30,
    placed_at: "2026-11-15T18:22:00.000Z",
    lines: [{ menu_item_id: "mi-muni-waakye", name: "Waakye with shito & egg", quantity: 2, price: 30 }],
  },
];

for (const order of INCOMING_ORDERS) {
  const subtotal = order.lines.reduce((total, line) => total + line.price * line.quantity, 0);

  orderRows.push({
    id: order.id,
    user_id: order.user_id,
    restaurant_id: "rst-auntie-muni",
    rider_id: null,
    number: order.number,
    fulfilment: order.fulfilment,
    status: order.status,
    subtotal,
    discount: 0,
    delivery_fee: order.fulfilment === "delivery" ? 15 : 0,
    address: order.address,
    eta_minutes: order.eta_minutes,
    reference: order.reference,
    placed_at: order.placed_at,
  });

  order.lines.forEach((line, index) => {
    orderLineRows.push({
      id: `ol-${order.id}-${index + 1}`,
      order_id: order.id,
      menu_item_id: line.menu_item_id,
      name: line.name,
      size: "Regular",
      toppings: [],
      quantity: line.quantity,
      price: line.price,
    });
  });
}

// -- rides ------------------------------------------------------------------

const rideRows = [];
const seenRideIds = new Set();

const RIDE_STATUS = {
  preparing: "requested",
  "on the way": "in progress",
  arriving: "arriving",
  delivered: "completed",
};

for (const delivery of deliveries.filter((entry) => entry.kind === "ride")) {
  const booking = bookings.find((entry) => entry.kind === "ride" && entry.reference === delivery.reference);
  seenRideIds.add(delivery.id);

  rideRows.push({
    id: delivery.id,
    user_id: DEMO_USER,
    rider_id: driverIdFor(delivery.rider.name),
    ride_class: rideClassIdFor(delivery.title),
    pickup: delivery.from,
    pickup_area: delivery.fromPlace,
    dropoff: delivery.to,
    dropoff_area: delivery.toPlace,
    distance_km: rideQuote.distanceKm,
    duration_minutes: rideQuote.durationMinutes,
    price: booking?.price ?? rideQuote.classes[1]?.price ?? 0,
    passengers: 1,
    status: RIDE_STATUS[delivery.status] ?? "requested",
    number: delivery.number,
    eta_minutes: minutesIn(delivery.eta),
    reference: delivery.reference,
    requested_at: booking?.when ?? FALLBACK_INSTANT,
  });
}

for (const booking of bookings.filter((entry) => entry.kind === "ride")) {
  const id = rideIdFor(booking);
  if (seenRideIds.has(id)) continue;
  seenRideIds.add(id);

  const [pickup, dropoff] = (booking.subtitle ?? "").split(" → ");
  const plate = (booking.details?.[0] ?? "").split("•").pop()?.trim() ?? "";

  rideRows.push({
    id,
    user_id: DEMO_USER,
    rider_id: driverIdForPlate(plate),
    ride_class: rideClassIdFor(booking.title),
    pickup,
    pickup_area: areaFor(pickup),
    dropoff,
    dropoff_area: areaFor(dropoff),
    distance_km: rideQuote.distanceKm,
    duration_minutes: rideQuote.durationMinutes,
    price: booking.price,
    passengers: 1,
    status: booking.status === "cancelled" ? "cancelled" : booking.status === "completed" ? "completed" : "requested",
    number: id.split("-").pop(),
    eta_minutes: 0,
    reference: booking.reference,
    requested_at: booking.when,
  });
}

// Past rides — the Track screen's history keeps them, and so does the database.
for (const past of pastDeliveries) {
  if (!past.title.startsWith("Flash")) continue;
  const id = PAST_RIDE_IDS[past.id] ?? `ride-${past.id}`;
  if (seenRideIds.has(id)) continue;
  seenRideIds.add(id);

  const [route, riderName] = (past.subtitle ?? "").split(" · ");
  const [pickup, dropoff] = (route ?? "").split(" → ");

  rideRows.push({
    id,
    user_id: DEMO_USER,
    rider_id: driverIdFor(riderName ?? ""),
    ride_class: rideClassIdFor(past.title),
    pickup,
    pickup_area: areaFor(pickup),
    dropoff,
    dropoff_area: areaFor(dropoff),
    distance_km: rideQuote.distanceKm,
    duration_minutes: rideQuote.durationMinutes,
    price: past.price,
    passengers: 1,
    status: "completed",
    number: id.split("-").pop(),
    eta_minutes: 0,
    reference: `FLS-${id.split("-").pop()}-2208`,
    requested_at: isoFromDayMonth(past.when),
  });
}

// -- parcels ----------------------------------------------------------------

const PARCEL_STATUS = {
  "Parcel booked": "booked",
  "Courier assigned": "assigned",
  "Picked up": "picked up",
  Delivered: "delivered",
};

const parcelRows = deliveries
  .filter((entry) => entry.kind === "parcel")
  .map((delivery) => ({
    id: delivery.id,
    user_id: DEMO_USER,
    courier_id: driverIdFor(delivery.rider.name),
    parcel_type: delivery.parcelType ?? "Documents",
    parcel_size: "small",
    quantity: 1,
    pickup: delivery.from,
    pickup_area: delivery.fromPlace,
    dropoff: delivery.to,
    dropoff_area: delivery.toPlace,
    distance_km: parcelQuote.distanceKm,
    price: parcelQuote.price,
    eta_minutes: minutesIn(delivery.eta),
    status: PARCEL_STATUS[delivery.steps.find((step) => step.current)?.label] ?? "booked",
    tracking_number: delivery.number,
    scheduled_for: null,
    requested_at: FALLBACK_INSTANT,
  }));

// ---------------------------------------------------------------------------
// Statements
// ---------------------------------------------------------------------------

function insert(table, columns, rows, conflict) {
  const updates = columns.map((column) => `${column} = excluded.${column}`).join(", ");
  return rows
    .map(
      (values) =>
        `insert into public.${table} (${columns.join(", ")})\nvalues (${values.join(", ")})\non conflict (${conflict}) do update set ${updates};`,
    )
    .join("\n\n");
}

const statements = [
  insert(
    "profiles",
    ["id", "name", "email", "avatar_src", "avatar_alt", "member_since", "notifications_enabled"],
    profileRows.map((row) => [t(row.id), t(row.name), t(row.email), t(row.avatar_src), t(row.avatar_alt), t(row.member_since), b(row.notifications_enabled)]),
    "id",
  ),
  insert(
    "events",
    [
      "id", "slug", "title", "subtitle", "description", "venue", "neighbourhood", "city",
      "distance_km", "event_date", "start_time", "end_time", "image_src", "image_alt",
      "categories", "featured", "trending", "live", "price_from", "going", "capacity",
      "owner_user_id", "discount_percent",
    ],
    eventRows.map((row) => [
      t(row.id), t(row.slug), t(row.title), t(row.subtitle), t(row.description), t(row.venue),
      t(row.neighbourhood), t(row.city), n(row.distance_km), d(row.event_date), tm(row.start_time),
      tm(row.end_time), t(row.image_src), t(row.image_alt), arr(row.categories), b(row.featured),
      b(row.trending), b(row.live), n(row.price_from), n(row.going), n(row.capacity),
      t(row.owner_user_id), n(row.discount_percent),
    ]),
    "id",
  ),
  insert(
    "event_tiers",
    ["id", "event_id", "name", "description", "price", "perks", "available"],
    tierRows.map((row) => [t(row.id), t(row.event_id), t(row.name), t(row.description), n(row.price), arr(row.perks), n(row.available)]),
    "id",
  ),
  insert(
    "tickets",
    ["id", "user_id", "event_id", "tier_id", "tier_name", "quantity", "status", "reference", "purchased_at"],
    ticketRows.map((row) => [
      t(row.id), t(row.user_id), t(row.event_id), t(row.tier_id), t(row.tier_name),
      n(row.quantity), t(row.status), t(row.reference), ts(row.purchased_at),
    ]),
    "id",
  ),
  insert(
    "restaurants",
    [
      "id", "slug", "name", "tagline", "cuisine", "neighbourhood", "rating", "rating_count",
      "delivery_fee", "eta_minutes", "distance_km", "badge", "discount_percent", "owner_user_id",
      "image_src", "image_alt",
    ],
    restaurantRows.map((row) => [
      t(row.id), t(row.slug), t(row.name), t(row.tagline), t(row.cuisine), t(row.neighbourhood),
      n(row.rating), n(row.rating_count), n(row.delivery_fee), n(row.eta_minutes),
      n(row.distance_km), t(row.badge), n(row.discount_percent), t(row.owner_user_id),
      t(row.image_src), t(row.image_alt),
    ]),
    "id",
  ),
  insert(
    "menu_items",
    ["id", "restaurant_id", "name", "description", "tagline", "price", "image_src", "image_alt", "popular", "vegetarian"],
    menuRows.map((row) => [
      t(row.id), t(row.restaurant_id), t(row.name), t(row.description), t(row.tagline), n(row.price),
      t(row.image_src), t(row.image_alt), b(row.popular), b(row.vegetarian),
    ]),
    "id",
  ),
  insert(
    "menu_item_sizes",
    ["id", "menu_item_id", "name", "price", "position"],
    sizeRows.map((row) => [t(row.id), t(row.menu_item_id), t(row.name), n(row.price), n(row.position)]),
    "id",
  ),
  insert(
    "menu_item_toppings",
    ["id", "menu_item_id", "name", "price", "position"],
    toppingRows.map((row) => [t(row.id), t(row.menu_item_id), t(row.name), n(row.price), n(row.position)]),
    "id",
  ),
  insert(
    "businesses",
    [
      "id",
      "user_id",
      "kind",
      "name",
      "email",
      "phone",
      "neighbourhood",
      "about",
      "status",
      "decided_at",
    ],
    businessRows.map((row) => [
      t(row.id), t(row.user_id), t(row.kind), t(row.name), t(row.email), t(row.phone),
      t(row.neighbourhood), t(row.about), t(row.status),
      row.status === "pending" ? "null" : t("2026-08-21T08:05:00.000Z"),
    ]),
    "id",
  ),
  insert(
    "drivers",
    ["id", "name", "rating", "photo_src", "photo_alt", "plate", "vehicle", "completed_rides"],
    driverRows.map((row) => [
      t(row.id), t(row.name), n(row.rating), t(row.photo?.src ?? ""), t(row.photo?.alt ?? ""),
      t(row.plate), t(row.vehicle), n(row.completedRides),
    ]),
    "id",
  ),
  insert(
    "ride_classes",
    ["id", "name", "description", "seats", "eta_minutes", "price", "perk", "position"],
    rideClassRows.map((row) => [t(row.id), t(row.name), t(row.description), n(row.seats), n(row.eta_minutes), n(row.price), t(row.perk), n(row.position)]),
    "id",
  ),
  insert(
    "orders",
    [
      "id", "user_id", "restaurant_id", "rider_id", "number", "fulfilment", "status",
      "subtotal", "discount", "delivery_fee", "address", "eta_minutes", "reference", "placed_at",
    ],
    orderRows.map((row) => [
      t(row.id), t(row.user_id), t(row.restaurant_id), t(row.rider_id), t(row.number),
      t(row.fulfilment), t(row.status), n(row.subtotal), n(row.discount), n(row.delivery_fee),
      t(row.address), n(row.eta_minutes), t(row.reference), ts(row.placed_at),
    ]),
    "id",
  ),
  insert(
    "order_lines",
    ["id", "order_id", "menu_item_id", "name", "size", "toppings", "quantity", "price"],
    orderLineRows.map((row) => [
      t(row.id), t(row.order_id), t(row.menu_item_id), t(row.name), t(row.size),
      arr(row.toppings), n(row.quantity), n(row.price),
    ]),
    "id",
  ),
  insert(
    "rides",
    [
      "id", "user_id", "rider_id", "ride_class", "pickup", "pickup_area", "dropoff",
      "dropoff_area", "distance_km", "duration_minutes", "eta_minutes", "price", "passengers",
      "status", "number", "reference", "requested_at",
    ],
    rideRows.map((row) => [
      t(row.id), t(row.user_id), t(row.rider_id), t(row.ride_class), t(row.pickup), t(row.pickup_area),
      t(row.dropoff), t(row.dropoff_area), n(row.distance_km), n(row.duration_minutes),
      n(row.eta_minutes), n(row.price), n(row.passengers), t(row.status), t(row.number), t(row.reference),
      ts(row.requested_at),
    ]),
    "id",
  ),
  insert(
    "parcels",
    [
      "id", "user_id", "courier_id", "parcel_type", "parcel_size", "quantity", "pickup", "pickup_area",
      "dropoff", "dropoff_area", "distance_km", "price", "eta_minutes", "status",
      "tracking_number", "scheduled_for", "requested_at",
    ],
    parcelRows.map((row) => [
      t(row.id), t(row.user_id), t(row.courier_id), t(row.parcel_type), t(row.parcel_size),
      n(row.quantity),
      t(row.pickup), t(row.pickup_area),
      t(row.dropoff), t(row.dropoff_area), n(row.distance_km), n(row.price),
      n(row.eta_minutes), t(row.status), t(row.tracking_number), t(row.scheduled_for), ts(row.requested_at),
    ]),
    "id",
  ),
  insert(
    "saved_places",
    ["user_id", "id", "label", "detail", "position"],
    savedPlaceRows.map((row) => [t(row.user_id), t(row.id), t(row.label), t(row.detail), n(row.position)]),
    "user_id, id",
  ),
];

const header = `-- Flash demo seed.
--
-- Generated by scripts/generate-seed.mjs from the fixtures in
-- src/lib/flash/data. Run \`npm run db:seed\` after changing them.
--
-- Everything here is demo data: invented kitchens, invented fares, invented
-- ratings. The customer is the seeded demo account; a real Clerk user gets an
-- empty wallet.

`;

const output = header + statements.join("\n\n") + "\n";
const target = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "supabase", "seed.sql");
await writeFile(target, output, "utf8");

console.log(`wrote ${target}`);
console.log(
  [
    `profiles ${profileRows.length}`,
    `events ${eventRows.length}`,
    `event_tiers ${tierRows.length}`,
    `tickets ${ticketRows.length}`,
    `restaurants ${restaurantRows.length}`,
    `menu_items ${menuRows.length}`,
    `menu_item_sizes ${sizeRows.length}`,
    `menu_item_toppings ${toppingRows.length}`,
    `businesses ${businessRows.length}`,
    `drivers ${driverRows.length}`,
    `ride_classes ${rideClassRows.length}`,
    `orders ${orderRows.length}`,
    `order_lines ${orderLineRows.length}`,
    `rides ${rideRows.length}`,
    `parcels ${parcelRows.length}`,
    `saved_places ${savedPlaceRows.length}`,
  ].join(", "),
);

