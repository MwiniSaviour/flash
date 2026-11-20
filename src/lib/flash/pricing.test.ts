import { describe, expect, it } from "vitest";

import { DEMO_SETTINGS } from "@/lib/payments/commission-math";

import {
  deliveryFeeFor,
  parcelFareCedis,
  rideFareCedis,
  type TransportRates,
} from "./pricing";

const rates: TransportRates = {
  ridePerKmPesewas: DEMO_SETTINGS.ridePerKmPesewas,
  parcelPerKmPesewas: DEMO_SETTINGS.parcelPerKmPesewas,
  deliveryPerKmPesewas: DEMO_SETTINGS.deliveryPerKmPesewas,
  deliveryBaseKm: DEMO_SETTINGS.deliveryBaseKm,
};

describe("rideFareCedis", () => {
  it("charges the class base fare for a trip within the base distance", () => {
    expect(rideFareCedis(28, 3, rates)).toBe(28);
  });

  it("adds the per-km surcharge for the distance beyond the base", () => {
    expect(rideFareCedis(28, 10, rates)).toBe(36);
  });

  it("follows an adjusted rate from the admin console", () => {
    const dearer = { ...rates, ridePerKmPesewas: 200 };
    expect(rideFareCedis(28, 10, dearer)).toBe(42);
  });
});

describe("parcelFareCedis", () => {
  it("charges the base price times the size multiplier within the base distance", () => {
    expect(parcelFareCedis(18, 1.35, 4, rates)).toBe(24);
  });

  it("adds the per-km surcharge for the distance beyond the base", () => {
    expect(parcelFareCedis(18, 1, 8, rates)).toBe(21);
  });
});

describe("deliveryFeeFor", () => {
  it("charges the base fee within the base distance", () => {
    expect(deliveryFeeFor(3, 10, "delivery", rates.deliveryPerKmPesewas, rates.deliveryBaseKm)).toBe(
      10,
    );
  });

  it("adds the per-km surcharge beyond the base distance", () => {
    expect(deliveryFeeFor(8, 10, "delivery", rates.deliveryPerKmPesewas, rates.deliveryBaseKm)).toBe(
      20,
    );
  });

  it("is free when the order is collected", () => {
    expect(deliveryFeeFor(20, 10, "pickup", rates.deliveryPerKmPesewas, rates.deliveryBaseKm)).toBe(
      0,
    );
  });
});
