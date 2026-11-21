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
  it("charges distance times the per-km rate with no fixed base add-on", () => {
    expect(rideFareCedis("flash-bike", 11.7, rates)).toBe(11);
  });

  it("scales the fare by the ride class", () => {
    expect(rideFareCedis("flash-go", 11.7, rates)).toBe(17);
  });

  it("follows an adjusted rate from the admin console", () => {
    const dearer = { ...rates, ridePerKmPesewas: 150 };
    expect(rideFareCedis("flash-bike", 11.7, dearer)).toBe(17);
  });
});

describe("parcelFareCedis", () => {
  it("charges distance times the per-km rate with no base add-on", () => {
    expect(parcelFareCedis(1, 1, 11.7, rates)).toBe(11);
  });

  it("scales the fare by parcel type and size", () => {
    expect(parcelFareCedis(1.6, 1.35, 8, rates)).toBe(17);
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
