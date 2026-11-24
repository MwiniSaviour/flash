/**
 * Delivery mappers.
 *
 * A delivery is the app's view of "something of mine is moving": a food order,
 * a ride or a parcel. The database stores each of those in its own table, so
 * this module turns rows into the one shape the Track screen renders — and
 * derives the progress, the step list and the countdown from the status the
 * row actually carries.
 */

import { adaptDispatchStatus } from "@/lib/dispatch/status";

import { clock, dayMonth } from "./format";
import type {
  Delivery,
  DeliveryStage,
  DeliveryStep,
  PastDelivery,
} from "./data/tracking";
import type { Fulfilment } from "./types";
import type {
  DriverRow,
  OrderWithLinesRow,
  ParcelWithCourierRow,
  RideWithRiderRow,
} from "./rows";

/** Cards that are not a photo of the thing itself borrow the ride photograph. */
const RIDE_CARD_IMAGE = {
  src: "/assets/images/ride-driver-pov.jpg",
  alt: "A driver's hands on the steering wheel at dusk",
};

const PARCEL_CARD_IMAGE = {
  src: "/assets/images/ride-bike-sunset.jpg",
  alt: "A motorcyclist riding at sunset on an open road",
};

const ORDER_STEPS = ["Order placed", "Kitchen accepted", "Picked up", "Delivered"];
const RIDE_STEPS = ["Ride requested", "Rider assigned", "On the way", "Arrived"];
const PARCEL_STEPS = ["Parcel booked", "Courier assigned", "Picked up", "Delivered"];

const ORDER_PROGRESS: Record<string, number> = {
  preparing: 0.18,
  "on the way": 0.62,
  delivered: 1,
};

/** Order rows carry database words; the card only renders DeliveryStage values. */
const ORDER_STAGE: Record<string, DeliveryStage> = {
  "awaiting confirmation": "pending delivery",
  confirmed: "confirmed",
  preparing: "preparing",
  "on the way": "on the way",
  arriving: "arriving",
  delivered: "delivered",
};

const ORDER_LABEL: Record<string, string> = {
  "awaiting confirmation": "Awaiting confirmation",
  confirmed: "Confirmed",
  preparing: "Preparing",
  "on the way": "On the way",
  arriving: "Arriving",
  delivered: "Delivered",
};

/** Food orders are not dispatched; their step index is local to the kitchen. */
const ORDER_STEP: Record<string, number> = {
  preparing: 0,
  "on the way": 2,
  delivered: ORDER_STEPS.length,
};

function buildSteps(labels: string[], step: number): DeliveryStep[] {
  const reached = Math.min(step, labels.length);
  return labels.map((label, index) => ({
    label,
    done: index < reached,
    current: index === reached,
  }));
}

function etaText(minutes: number): string {
  return minutes <= 0 ? "Arriving" : `${minutes} min`;
}

/**
 * Only these stages describe a rider actually covering a route. Scheduled,
 * looking-for-a-rider and failed jobs are commitments, not live progress —
 * their DispatchView progress values are engine bookkeeping, not distance a
 * customer has seen covered.
 */
const LIVE_STAGES: ReadonlySet<DeliveryStage> = new Set([
  "on the way",
  "arriving",
  "delivered",
]);

function liveJourney(stage: DeliveryStage, hasRider: boolean): boolean {
  return hasRider && LIVE_STAGES.has(stage);
}

/** A finished journey has no countdown left; a scheduled window is not an ETA. */
function liveEta(stage: DeliveryStage, hasRider: boolean, etaMinutes: number): string {
  if (!liveJourney(stage, hasRider) || stage === "delivered") return "";
  return etaText(etaMinutes);
}

/** The one progress predicate shared by the mappers and the tracking card. */
export function hasLiveProgress(delivery: Delivery): boolean {
  return liveJourney(delivery.status, delivery.riderAssigned);
}

/** While no rider is assigned, the customer reaches ScalDive support. */
function unassignedRider(): Delivery["rider"] {
  return {
    name: "Costumer Support",
    photo: { src: "/assets/images/customer-support.svg", alt: "Customer support agent with a headset" },
    vehicle: "",
    plate: "",
  };
}

function riderOf(driver: DriverRow | null): Delivery["rider"] {
  if (!driver) return unassignedRider();
  return {
    name: driver.name,
    photo: { src: driver.photo_src, alt: driver.photo_alt },
    vehicle: driver.vehicle,
    plate: driver.plate,
  };
}

/** "Nii Boa Street, Ridge" → the street and the area on their own. */
function splitAddress(address: string): { street: string; area: string } {
  const [street = "", ...rest] = address.split(",");
  const area = rest.join(",").trim();
  return { street: street.trim(), area: area ? `${area}, Accra` : "Accra" };
}

export function orderToDelivery(order: OrderWithLinesRow): Delivery {
  const restaurant = order.restaurants;
  const { street, area } = splitAddress(order.address);
  const lines = order.order_lines ?? [];
  const status: DeliveryStage = ORDER_STAGE[order.status] ?? "pending delivery";
  const hasRider = Boolean(order.drivers);
  const live = liveJourney(status, hasRider);

  return {
    id: order.id,
    kind: "order",
    number: order.number,
    title: restaurant?.name ?? "Your order",
    status,
    statusLabel: ORDER_LABEL[order.status] ?? "Pending delivery",
    from: restaurant?.name ?? "The kitchen",
    fromPlace: restaurant?.neighbourhood ?? "Accra",
    to: street,
    toPlace: area,
    progress: live ? (ORDER_PROGRESS[order.status] ?? 0) : 0,
    eta: liveEta(status, hasRider, order.eta_minutes),
    reference: order.reference,
    price: order.subtotal + order.delivery_fee,
    riderAssigned: hasRider,
    rider: riderOf(order.drivers),
    image: restaurant
      ? { src: restaurant.image_src, alt: restaurant.image_alt }
      : RIDE_CARD_IMAGE,
    steps: buildSteps(ORDER_STEPS, ORDER_STEP[order.status] ?? 0),
    receipt: {
      lines: lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        price: line.price,
      })),
      subtotal: order.subtotal,
      discount: order.discount || undefined,
      deliveryFee: order.delivery_fee,
      total: order.subtotal - (order.discount ?? 0) + order.delivery_fee,
      address: order.address,
      fulfilment: (order.fulfilment as Fulfilment) ?? "delivery",
    },
  };
}

export function rideToDelivery(ride: RideWithRiderRow): Delivery {
  const className = ride.ride_classes?.name ?? "Taxi";
  const view = adaptDispatchStatus(ride.dispatch_task_status ?? ride.status, ride.scheduled_for);
  const hasRider = Boolean(ride.drivers);
  const live = liveJourney(view.stage, hasRider);

  return {
    id: ride.id,
    kind: "ride",
    number: ride.number,
    title: `${className} to ${ride.dropoff}`,
    status: view.stage,
    statusLabel: view.label,
    from: ride.pickup,
    fromPlace: ride.pickup_area,
    to: ride.dropoff,
    toPlace: ride.dropoff_area,
    progress: live ? view.progress : 0,
    eta: liveEta(view.stage, hasRider, ride.eta_minutes),
    reference: ride.reference,
    price: ride.price,
    distanceKm: live ? ride.distance_km : undefined,
    durationMinutes: live ? ride.duration_minutes : undefined,
    riderAssigned: hasRider,
    rider: riderOf(ride.drivers),
    image: RIDE_CARD_IMAGE,
    steps: buildSteps(RIDE_STEPS, view.step),
  };
}

export function parcelToDelivery(parcel: ParcelWithCourierRow): Delivery {
  const view = adaptDispatchStatus(parcel.dispatch_task_status ?? parcel.status, parcel.scheduled_for);
  const hasRider = Boolean(parcel.drivers);
  const live = liveJourney(view.stage, hasRider);

  return {
    id: parcel.id,
    kind: "parcel",
    number: parcel.tracking_number,
    parcelType: parcel.parcel_type,
    recipientName: parcel.recipient_name,
    recipientPhone: parcel.recipient_phone,
    parcelDetails: parcel.details,
    title:
      parcel.quantity > 1
        ? `${parcel.quantity} × ${parcel.parcel_type} to ${parcel.dropoff}`
        : `${parcel.parcel_type} to ${parcel.dropoff}`,
    status: view.stage,
    statusLabel: view.label,
    from: parcel.pickup,
    fromPlace: parcel.pickup_area,
    to: parcel.dropoff,
    toPlace: parcel.dropoff_area,
    progress: live ? view.progress : 0,
    eta: liveEta(view.stage, hasRider, parcel.eta_minutes),
    reference: parcel.tracking_number,
    price: parcel.price,
    distanceKm: live ? parcel.distance_km : undefined,
    riderAssigned: hasRider,
    rider: riderOf(parcel.drivers),
    image: PARCEL_CARD_IMAGE,
    steps: buildSteps(PARCEL_STEPS, view.step),
  };
}

/** A finished order, in the history list under Track. */
export function orderToPastDelivery(order: OrderWithLinesRow): PastDelivery {
  const restaurant = order.restaurants;
  const lines = order.order_lines ?? [];
  const first = lines[0];

  return {
    id: order.id,
    title: restaurant?.name ?? "Your order",
    subtitle: first
      ? `${first.name} · delivered in ${order.eta_minutes} min`
      : `Delivered in ${order.eta_minutes} min`,
    when: dayMonth(order.placed_at),
    price: order.subtotal + order.delivery_fee,
    image: restaurant
      ? { src: restaurant.image_src, alt: restaurant.image_alt }
      : RIDE_CARD_IMAGE,
    href: `/orders/${order.id}`,
  };
}

/** A finished ride, in the history list under Track. */
export function rideToPastDelivery(ride: RideWithRiderRow): PastDelivery {
  const className = ride.ride_classes?.name ?? "Taxi";

  return {
    id: ride.id,
    title: `${className} to ${ride.dropoff}`,
    subtitle: `${ride.pickup} → ${ride.dropoff}${
      ride.drivers ? ` · ${ride.drivers.name}` : ""
    }`,
    when: dayMonth(ride.requested_at),
    price: ride.price,
    image: PARCEL_CARD_IMAGE,
    href: `/rides/${ride.id}`,
  };
}

/** A finished parcel, in the history list under Track. */
export function parcelToPastDelivery(parcel: ParcelWithCourierRow): PastDelivery {
  return {
    id: parcel.id,
    title:
      parcel.quantity > 1
        ? `${parcel.quantity} × ${parcel.parcel_type}`
        : parcel.parcel_type,
    subtitle: `${parcel.pickup} → ${parcel.dropoff}${
      parcel.recipient_name ? ` · ${parcel.recipient_name}` : ""
    }`,
    when: dayMonth(parcel.requested_at),
    price: parcel.price,
    image: PARCEL_CARD_IMAGE,
    href: `/parcels/${parcel.id}`,
  };
}

/** "18:00" → "5:30 PM", the half hour before doors open. */
export function doorsTime(startTime: string): string {
  const [rawHour = "0", rawMinute = "0"] = startTime.split(":");
  const total = (Number(rawHour) * 60 + Number(rawMinute) - 30 + 24 * 60) % (24 * 60);
  return clock(
    `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`,
  );
}
