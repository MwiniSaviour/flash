/**
 * Demo parcel fixtures.
 *
 * Flash sends parcels as well as moving people and food. The prices are the
 * courier's own list — invented for this pass, shaped so a real quote endpoint
 * can replace them without touching a screen.
 */

import type { IconName } from "@/components/flash/Icon";

export interface ParcelType {
  id: string;
  name: string;
  detail: string;
  /** Whole cedis for the standard size. */
  price: number;
  etaMinutes: number;
  icon: IconName;
}

export const parcelTypes: ParcelType[] = [
  {
    id: "documents",
    name: "Documents",
    detail: "Passport, contract, keys, a folder",
    price: 18,
    etaMinutes: 25,
    icon: "receipt",
  },
  {
    id: "electronics",
    name: "Phone & laptop",
    detail: "Padded, sealed and tracked end to end",
    price: 35,
    etaMinutes: 35,
    icon: "package",
  },
  {
    id: "clothes",
    name: "Clothes & shoes",
    detail: "Folded, bagged and handed over sealed",
    price: 25,
    etaMinutes: 30,
    icon: "bag",
  },
  {
    id: "groceries",
    name: "Groceries & food",
    detail: "Chilled where it needs to be",
    price: 30,
    etaMinutes: 30,
    icon: "food",
  },
  {
    id: "box",
    name: "Box & luggage",
    detail: "Anything that needs two hands",
    price: 55,
    etaMinutes: 45,
    icon: "van",
  },
];

/**
 * How many parcels one booking can carry. Every parcel is charged on its own,
 * so the count is what moves the price.
 */
export const MAX_PARCELS = 6;

export type ParcelSize = "small" | "medium" | "large";

export const parcelSizes: { id: ParcelSize; label: string; detail: string; multiplier: number }[] = [
  { id: "small", label: "Small", detail: "Fits in a backpack", multiplier: 1 },
  { id: "medium", label: "Medium", detail: "Fits in a car boot", multiplier: 1.35 },
  { id: "large", label: "Large", detail: "Needs a van", multiplier: 1.8 },
];

export interface ParcelQuote {
  distanceKm: number;
  durationMinutes: number;
  price: number;
  etaMinutes: number;
  /** The courier class that will carry it. */
  courier: { name: string; vehicle: string; etaMinutes: number };
}

/**
 * The quote the parcel screen opens with: a short hop across Accra with a
 * document-sized parcel.
 */
export const parcelQuote: ParcelQuote = {
  distanceKm: 4.6,
  durationMinutes: 19,
  price: 18,
  etaMinutes: 25,
  courier: { name: "Flash Courier", vehicle: "Motorbike • Document bag", etaMinutes: 25 },
};

/** What the parcel screen quotes: the type and the size decide the price. */
export function quoteParcel(
  type: ParcelType,
  size: ParcelSize,
  distanceKm = parcelQuote.distanceKm,
): ParcelQuote {
  const multiplier = parcelSizes.find((item) => item.id === size)?.multiplier ?? 1;
  const distanceFactor = 1 + Math.max(0, distanceKm - 4.6) * 0.06;

  return {
    distanceKm,
    durationMinutes: Math.round(parcelQuote.durationMinutes + (distanceKm - 4.6) * 1.4),
    price: Math.round(type.price * multiplier * distanceFactor),
    etaMinutes: Math.round(type.etaMinutes + (distanceKm - 4.6) * 1.4),
    courier: {
      name: "Flash Courier",
      vehicle: size === "large" ? "Van • Parcel bay" : "Motorbike • Parcel bag",
      etaMinutes: Math.round(type.etaMinutes + (distanceKm - 4.6) * 1.4),
    },
  };
}

/** A tracking number in the product's own reference format. */
export function parcelTrackingNumber(seed: number) {
  return `FLS-P-${String(seed).padStart(4, "0")}-${String(seed * 7).slice(0, 4)}`;
}
