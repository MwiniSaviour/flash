/**
 * Delivery mappers.
 *
 * A delivery is the app's view of "something of mine is moving": a food order,
 * a ride or a parcel. The database stores each of those in its own table, so
 * this module turns rows into the one shape the Track screen renders — and
 * derives the progress, the step list and the countdown from the status the
 * row actually carries.
 */

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

const RIDE_PROGRESS: Record<string, number> = {
  requested: 0.12,
  accepted: 0.3,
  "in progress": 0.6,
  arriving: 0.84,
  completed: 1,
  cancelled: 0,
};

const PARCEL_PROGRESS: Record<string, number> = {
  booked: 0.12,
  assigned: 0.3,
  "picked up": 0.44,
  delivered: 1,
};

const RIDE_STAGE: Record<string, DeliveryStage> = {
  requested: "preparing",
  accepted: "preparing",
  "in progress": "on the way",
  arriving: "arriving",
  completed: "delivered",
  cancelled: "preparing",
};

const RIDE_LABEL: Record<string, string> = {
  requested: "Requested",
  accepted: "Rider assigned",
  "in progress": "On the way",
  arriving: "Arriving",
  completed: "Arrived",
  cancelled: "Cancelled",
};

const PARCEL_STAGE: Record<string, DeliveryStage> = {
  booked: "preparing",
  assigned: "preparing",
  "picked up": "on the way",
  delivered: "delivered",
};

const PARCEL_LABEL: Record<string, string> = {
  booked: "Parcel booked",
  assigned: "Courier assigned",
  "picked up": "With the courier",
  delivered: "Delivered",
};

const ORDER_LABEL: Record<string, string> = {
  preparing: "Preparing",
  "on the way": "On the way",
  delivered: "Delivered",
};

/** Which step of the journey the delivery has reached. */
function currentStep(steps: string[], status: string): number {
  switch (status) {
    case "preparing":
    case "booked":
      return 0;
    case "requested":
      return 0;
    case "accepted":
    case "assigned":
      return 1;
    case "on the way":
    case "picked up":
    case "in progress":
      return 2;
    case "arriving":
      return 2;
    case "delivered":
    case "completed":
      return steps.length;
    default:
      return 0;
  }
}

function buildSteps(labels: string[], status: string): DeliveryStep[] {
  const reached = currentStep(labels, status);
  return labels.map((label, index) => ({
    label,
    done: index < reached,
    current: index === reached,
  }));
}

function etaText(minutes: number): string {
  return minutes <= 0 ? "Arriving" : `${minutes} min`;
}

/** A rider who has not been assigned yet still needs a name on the card. */
function unassignedRider(): Delivery["rider"] {
  return {
    name: "Rider being assigned",
    photo: { src: "", alt: "The rider being assigned to this delivery" },
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

  return {
    id: order.id,
    kind: "order",
    number: order.number,
    title: restaurant?.name ?? "Your order",
    status: (order.status as DeliveryStage) ?? "preparing",
    statusLabel: ORDER_LABEL[order.status] ?? "Preparing",
    from: restaurant?.name ?? "The kitchen",
    fromPlace: restaurant?.neighbourhood ?? "Accra",
    to: street,
    toPlace: area,
    progress: ORDER_PROGRESS[order.status] ?? 0.18,
    eta: etaText(order.eta_minutes),
    reference: order.reference,
    price: order.subtotal + order.delivery_fee,
    rider: riderOf(order.drivers),
    image: restaurant
      ? { src: restaurant.image_src, alt: restaurant.image_alt }
      : RIDE_CARD_IMAGE,
    steps: buildSteps(ORDER_STEPS, order.status),
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

  return {
    id: ride.id,
    kind: "ride",
    number: ride.number,
    title: `${className} to ${ride.dropoff}`,
    status: RIDE_STAGE[ride.status] ?? "preparing",
    statusLabel: RIDE_LABEL[ride.status] ?? "Requested",
    from: ride.pickup,
    fromPlace: ride.pickup_area,
    to: ride.dropoff,
    toPlace: ride.dropoff_area,
    progress: RIDE_PROGRESS[ride.status] ?? 0.12,
    eta: etaText(ride.eta_minutes),
    reference: ride.reference,
    price: ride.price,
    distanceKm: ride.distance_km,
    durationMinutes: ride.duration_minutes,
    rider: riderOf(ride.drivers),
    image: RIDE_CARD_IMAGE,
    steps: buildSteps(RIDE_STEPS, ride.status),
  };
}

export function parcelToDelivery(parcel: ParcelWithCourierRow): Delivery {
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
    status: PARCEL_STAGE[parcel.status] ?? "preparing",
    statusLabel: PARCEL_LABEL[parcel.status] ?? "Parcel booked",
    from: parcel.pickup,
    fromPlace: parcel.pickup_area,
    to: parcel.dropoff,
    toPlace: parcel.dropoff_area,
    progress: PARCEL_PROGRESS[parcel.status] ?? 0.12,
    eta: etaText(parcel.eta_minutes),
    reference: parcel.tracking_number,
    price: parcel.price,
    distanceKm: parcel.distance_km,
    rider: riderOf(parcel.drivers),
    image: PARCEL_CARD_IMAGE,
    steps: buildSteps(PARCEL_STEPS, parcel.status),
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

/** "18:00" → "5:30 PM", the half hour before doors open. */
export function doorsTime(startTime: string): string {
  const [rawHour = "0", rawMinute = "0"] = startTime.split(":");
  const total = (Number(rawHour) * 60 + Number(rawMinute) - 30 + 24 * 60) % (24 * 60);
  return clock(
    `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`,
  );
}
