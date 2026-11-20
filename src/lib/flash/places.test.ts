import { afterEach, describe, expect, it, vi } from "vitest";

import { haversineKm, type GeoPoint } from "./geo";
import { nearbyPlaces, toNearbyPlaces, type PhotonFeature } from "./places";

const center: GeoPoint = { lat: 9.9673103, lng: -2.4603285 };

function feature(name: string, lat: number, lng: number, osmKey = "place"): PhotonFeature {
  return {
    properties: {
      osm_type: "node",
      osm_id: 1,
      osm_key: osmKey,
      osm_value: "village",
      name,
      village: name,
      district: "Wa Municipal District",
      state: "Upper West Region",
    },
    geometry: { coordinates: [lng, lat] },
  };
}

describe("toNearbyPlaces", () => {
  it("keeps candidates within the radius, nearest first", () => {
    const places = toNearbyPlaces(
      [feature("Accra", 5.6, -0.18), feature("Kumfabiala", 9.99, -2.48), feature("Piisi", center.lat, center.lng)],
      center,
      25,
    );

    expect(places.map((place) => place.label)).toEqual(["Piisi", "Kumfabiala"]);
    expect(haversineKm(center, { lat: places[0].lat, lng: places[0].lng })).toBeLessThan(
      haversineKm(center, { lat: places[1].lat, lng: places[1].lng }),
    );
  });

  it("deduplicates repeated labels", () => {
    const places = toNearbyPlaces(
      [feature("Piisi", center.lat, center.lng), feature("Piisi", center.lat + 0.001, center.lng, "amenity")],
      center,
      25,
    );

    expect(places).toHaveLength(1);
  });
});

describe("nearbyPlaces", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("asks Photon for reverse candidates within a 25 km radius", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ features: [feature("Piisi", center.lat, center.lng)] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const places = await nearbyPlaces(center);

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe("/reverse");
    expect(url.searchParams.get("radius")).toBe("25");
    expect(url.searchParams.get("lat")).toBe(String(center.lat));
    expect(url.searchParams.get("lon")).toBe(String(center.lng));
    expect(url.searchParams.get("lang")).toBe("en");
    expect(places.map((place) => place.label)).toEqual(["Piisi"]);
  });

  it("returns no candidates when the geocoder fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    await expect(nearbyPlaces(center)).resolves.toEqual([]);
  });
});
