import type { Fulfilment } from "./types";

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

/** The delivery charge for a journey, in whole cedis. */
export function deliveryFeeFor(
  distanceKm: number,
  baseFee: number,
  fulfilment: Fulfilment = "delivery",
): number {
  if (fulfilment !== "delivery") return 0;

  const extraKm = Math.max(0, Math.ceil(distanceKm) - DELIVERY_BASE_KM);
  return baseFee + extraKm * DELIVERY_PER_KM;
}

/** The delivery charge for a kitchen, in whole cedis. */
export function deliveryQuote(
  kitchen: { deliveryFee: number; distanceKm: number },
  fulfilment: Fulfilment = "delivery",
): number {
  return deliveryFeeFor(kitchen.distanceKm, kitchen.deliveryFee, fulfilment);
}

/** What a discount takes off, in whole cedis. */
export function discountOn(subtotal: number, percent: number): number {
  if (percent <= 0) return 0;
  return Math.round((subtotal * percent) / 100);
}

/** The label a kitchen's offer carries. */
export function discountLabel(percent: number): string {
  return `${percent}% off`;
}

/** How the order reaches the customer, in the words the screen uses. */
export const FULFILMENT_LABEL: Record<Fulfilment, string> = {
  delivery: "Delivery",
  pickup: "Pick up",
  dine_in: "Dine in",
};
