import { haversineKm, type GeoPoint } from "./geo";

/**
 * Place search is streamed from Photon's CDN, an OpenStreetMap geocoder built
 * for typeahead. No town or street names are bundled with the app. Results are
 * cached on the device so a poor connection can still reuse recent searches.
 *
 * The public instance is fair-use only. If volume grows, point
 * NEXT_PUBLIC_GEOCODER_URL at our own Photon instance; nothing else changes.
 */
const GEOCODER_URL = (
  process.env.NEXT_PUBLIC_GEOCODER_URL ?? "https://photon.komoot.io"
).replace(/\/$/, "");

const CACHE_KEY = "flash.place-search.v1";

/** Wa is the first service area; bias results towards it until Accra launches. */
const DEFAULT_BIAS: GeoPoint = { lat: 10.0623, lng: -2.5054 };

export type Place = {
  id: string;
  label: string;
  detail: string;
  lat: number;
  lng: number;
  cached?: boolean;
};

type PhotonFeature = {
  properties: {
    osm_type?: string;
    osm_id?: number;
    name?: string;
    street?: string;
    city?: string;
    town?: string;
    village?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  geometry: { coordinates: [number, number] };
};

function labelFor(feature: PhotonFeature): { label: string; detail: string } {
  const p = feature.properties;
  const label = p.name || p.street || p.city || p.town || p.village || "Selected place";
  const parts = [p.street, p.city ?? p.town ?? p.village, p.district ?? p.county, p.state]
    .filter((part): part is string => Boolean(part && part !== label))
    .filter((part, index, all) => all.indexOf(part) === index);

  return { label, detail: parts.length ? parts.join(", ") : "Ghana" };
}

function toPlace(feature: PhotonFeature, cached = false): Place {
  const { label, detail } = labelFor(feature);
  const [lng, lat] = feature.geometry.coordinates;

  return {
    id: `${feature.properties.osm_type ?? "place"}-${feature.properties.osm_id ?? `${lat},${lng}`}`,
    label,
    detail,
    lat,
    lng,
    ...(cached ? { cached: true } : {}),
  };
}

function readCache(query: string): Place[] {
  if (typeof window === "undefined") return [];
  try {
    const store = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "{}") as Record<
      string,
      PhotonFeature[]
    >;
    return (store[query.toLowerCase()] ?? []).slice(0, 8).map((feature) => toPlace(feature, true));
  } catch {
    return [];
  }
}

function writeCache(query: string, features: PhotonFeature[]) {
  if (typeof window === "undefined") return;
  try {
    const store = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "{}") as Record<
      string,
      PhotonFeature[]
    >;
    store[query.toLowerCase()] = features.slice(0, 8);
    const keys = Object.keys(store);
    if (keys.length > 40) delete store[keys[0]];
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // Full or blocked storage only costs us the offline cache.
  }
}

/** Stream suggestions from the CDN. Falls back to cached results when offline. */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
  bias: GeoPoint = DEFAULT_BIAS,
): Promise<Place[]> {
  const needle = query.trim();
  if (needle.length < 2) return [];

  const params = new URLSearchParams({
    q: needle,
    limit: "8",
    lang: "en",
    lat: String(bias.lat),
    lon: String(bias.lng),
  });

  try {
    const response = await fetch(`${GEOCODER_URL}/api/?${params.toString()}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);

    const body = (await response.json()) as { features?: PhotonFeature[] };
    const features = body.features ?? [];
    writeCache(needle, features);
    return features.map((feature) => toPlace(feature));
  } catch {
    if (signal?.aborted) return [];
    return readCache(needle);
  }
}

/** Reverse geocode a device fix, or fall back to a coordinate label offline. */
export async function reverseGeocode(
  point: GeoPoint,
  signal?: AbortSignal,
): Promise<{ label: string; detail: string }> {
  const params = new URLSearchParams({
    lon: String(point.lng),
    lat: String(point.lat),
    limit: "1",
    lang: "en",
  });

  try {
    const response = await fetch(`${GEOCODER_URL}/reverse?${params.toString()}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);

    const body = (await response.json()) as { features?: PhotonFeature[] };
    const feature = body.features?.[0];
    if (!feature) throw new Error("No address found");

    return labelFor(feature);
  } catch {
    return {
      label: "Current location",
      detail: `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
    };
  }
}

export function distanceBetween(from: GeoPoint, to: GeoPoint): number {
  return haversineKm(from, to);
}
