import { DEMO_TODAY } from "./format";
import type { Fulfilment, MenuItem, TicketTier } from "./types";

type Discountable = Pick<
  MenuItem & TicketTier,
  "discountPercent" | "discountStartsAt" | "discountEndsAt"
>;

export type DiscountState = "none" | "scheduled" | "active" | "expired";

/**
 * What an order costs to get there.
 *
 * A kitchen's base fee covers the first few kilometres across Accra. Beyond
 * that the rider rides further, so the customer pays for the extra distance —
 * the same journey from a kitchen in Airport Residential costs more than one
 * from Osu. Collecting the order at the kitchen costs nothing: nobody rides
 * anywhere.
 */

/** The kilometres the base fee covers. */
export const DELIVERY_BASE_KM = 3;

/** What each kilometre beyond the base costs. */
export const DELIVERY_PER_KM = 2;

/** The kilometres a ride's class fare covers before the distance surcharge. */
export const RIDE_BASE_KM = 3;

/** The kilometres a parcel's base price covers before the distance surcharge. */
export const PARCEL_BASE_KM = 4.6;

/**
 * The distance rates the superadmin can change. They are a subset of
 * PlatformSettings so the same object can be passed straight through, and a
 * plain shape so the booking UI (a client component) can carry them as props.
 */
export type TransportRates = {
  ridePerKmPesewas: number;
  parcelPerKmPesewas: number;
  deliveryPerKmPesewas: number;
  deliveryBaseKm: number;
};

/** Defaults mirroring DEMO_SETTINGS, used when no database is connected. */
export const demoTransportRates: TransportRates = {
  ridePerKmPesewas: 120,
  parcelPerKmPesewas: 100,
  deliveryPerKmPesewas: 200,
  deliveryBaseKm: 3,
};

/** The delivery charge for a journey, in whole cedis. */
export function deliveryFeeFor(
  distanceKm: number,
  baseFee: number,
  fulfilment: Fulfilment = "delivery",
  perKmPesewas = DELIVERY_PER_KM * 100,
  baseKm = DELIVERY_BASE_KM,
): number {
  if (fulfilment !== "delivery") return 0;

  const extraKm = Math.max(0, Math.ceil(distanceKm) - baseKm);
  return baseFee + Math.round((extraKm * perKmPesewas) / 100);
}

/** The delivery charge for a kitchen, in whole cedis. */
export function deliveryQuote(
  kitchen: { deliveryFee: number; distanceKm: number },
  fulfilment: Fulfilment = "delivery",
  rates: TransportRates = demoTransportRates,
): number {
  return deliveryFeeFor(
    kitchen.distanceKm,
    kitchen.deliveryFee,
    fulfilment,
    rates.deliveryPerKmPesewas,
    rates.deliveryBaseKm,
  );
}

/** A ride's fare: the class's base fare plus the distance beyond the base. */
export function rideFareCedis(
  baseFare: number,
  distanceKm: number,
  rates: TransportRates = demoTransportRates,
): number {
  const extraKm = Math.max(0, Math.ceil(distanceKm) - RIDE_BASE_KM);
  return baseFare + Math.round((extraKm * rates.ridePerKmPesewas) / 100);
}

/** A parcel's fare: base price × size, plus the distance beyond the base. */
export function parcelFareCedis(
  basePrice: number,
  multiplier: number,
  distanceKm: number,
  rates: TransportRates = demoTransportRates,
): number {
  const extraKm = Math.max(0, Math.ceil(distanceKm) - PARCEL_BASE_KM);
  return Math.round(basePrice * multiplier + (extraKm * rates.parcelPerKmPesewas) / 100);
}

/** What a discount takes off, in whole cedis. */
export function discountOn(subtotal: number, percent: number): number {
  if (percent <= 0) return 0;
  return Math.round((subtotal * percent) / 100);
}

/** The label a discount carries. */
export function discountLabel(percent: number): string {
  return `${percent}% off`;
}

/**
 * Where a product's discount stands on a given day.
 *
 * A discount with no window is active as soon as it has a percent; a start
 * date in the future schedules it and an end date in the past expires it.
 * The caller passes the day so the console and the storefront agree on "today".
 */
export function discountState(item: Discountable, today: string = DEMO_TODAY): DiscountState {
  const percent = item.discountPercent ?? 0;
  if (percent <= 0) return "none";
  if (item.discountStartsAt && item.discountStartsAt > today) return "scheduled";
  if (item.discountEndsAt && item.discountEndsAt < today) return "expired";
  return "active";
}

/** The percentage a product actually gives today, before any rounding. */
export function activeDiscountPercent(
  item: Discountable,
  today: string = DEMO_TODAY,
): number {
  return discountState(item, today) === "active" ? (item.discountPercent ?? 0) : 0;
}

/** A price with the product's active discount taken off, in whole cedis. */
export function priceAfterDiscount(
  price: number,
  item: Discountable,
  today: string = DEMO_TODAY,
): number {
  return price - discountOn(price, activeDiscountPercent(item, today));
}

/** A short human label for a discount's schedule. */
export function discountWindow(
  item: Discountable,
  today: string = DEMO_TODAY,
): string {
  const state = discountState(item, today);
  if (state === "none") return "No discount";
  if (state === "scheduled") return `Starts ${item.discountStartsAt}`;
  if (state === "expired") return `Ended ${item.discountEndsAt}`;
  if (item.discountEndsAt) return `Until ${item.discountEndsAt}`;
  return "No expiry";
}

/** How the order reaches the customer, in the words the screen uses. */
export const FULFILMENT_LABEL: Record<Fulfilment, string> = {
  delivery: "Delivery",
  pickup: "Pick up",
  dine_in: "Dine in",
};
