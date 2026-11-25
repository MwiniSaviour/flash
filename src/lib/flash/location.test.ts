import { describe, expect, it } from "vitest";

import { filterByCity, matchesCity, parseCity } from "./location";

describe("parseCity", () => {
  it("accepts a trimmed city and rejects empty or oversized values", () => {
    expect(parseCity(" Wa ")).toBe("Wa");
    expect(parseCity("  ")).toBeNull();
    expect(parseCity("x".repeat(81))).toBeNull();
    expect(parseCity(null)).toBeNull();
  });
});

describe("matchesCity", () => {
  it("shows every area when the city is unknown", () => {
    expect(matchesCity(null, "Osu")).toBe(true);
    expect(matchesCity(null, null)).toBe(true);
  });

  it("matches a city against a city or neighbourhood without showing other areas", () => {
    expect(matchesCity("Wa", "Wa")).toBe(true);
    expect(matchesCity("wa", "Wa Municipal")).toBe(true);
    expect(matchesCity("Accra", "Osu")).toBe(false);
    expect(matchesCity("Wa", null)).toBe(false);
  });
});

describe("filterByCity", () => {
  const places = [
    { id: "1", city: "Wa" },
    { id: "2", city: "Accra" },
  ];

  it("keeps only the customer's area when a city is known", () => {
    expect(filterByCity(places, "Wa", (place) => place.city)).toEqual([places[0]]);
  });

  it("keeps everything when no city is known", () => {
    expect(filterByCity(places, null, (place) => place.city)).toEqual(places);
  });
});
