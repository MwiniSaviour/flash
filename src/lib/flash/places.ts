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

export type PhotonFeature = {
  properties: {
    osm_type?: string;
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    street?: string;
    city?: string;
    town?: string;
    village?: string;
    locality?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  geometry: { coordinates: [number, number] };
};

const POI_KEYS = new Set(["amenity", "tourism", "shop", "office", "leisure"]);

function labelFor(feature: PhotonFeature): { label: string; detail: string } {
  const p = feature.properties;
  const isPoi = Boolean(p.osm_key && POI_KEYS.has(p.osm_key));
  const area = p.city ?? p.town ?? p.village ?? p.locality ?? "";
  const street = p.street ?? "";
  const district = p.county ?? p.district ?? "";
  const state = p.state ?? "";

  // A hotel or a shop is not an address. Prefer the street or the town, and
  // keep the administrative context so the customer can recognise the area.
  const label = !isPoi && p.name ? p.name : street || area || "Current location";
  const parts = [street, area, district, state]
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
    limit: "5",
    lang: "en",
  });

  try {
    const response = await fetch(`${GEOCODER_URL}/reverse?${params.toString()}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);

    const body = (await response.json()) as { features?: PhotonFeature[] };
    const features = body.features ?? [];
    if (!features.length) throw new Error("No address found");

    const placeFeature =
      features.find((feature) => feature.properties.osm_key === "place") ??
      features.find((feature) => {
        const key = feature.properties.osm_key;
        return !key || !POI_KEYS.has(key);
      }) ??
      features[0];

    return labelFor(placeFeature);
  } catch {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.lat}&lon=${point.lng}&zoom=14&addressdetails=1`,
        { signal, headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
      const body = (await response.json()) as { address?: Record<string, string> };
      const address = body.address ?? {};
      const label =
        address.neighbourhood ||
        address.suburb ||
        address.village ||
        address.town ||
        address.city ||
        address.county ||
        "Current location";
      const detail = [address.county, address.state, address.country]
        .filter((part): part is string => Boolean(part && part !== label))
        .filter((part, index, all) => all.indexOf(part) === index)
        .join(", ");
      return { label, detail: detail || "Ghana" };
    } catch {
      return {
        label: "Current location",
        detail: `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
      };
    }
  }
}

/** How far from a coarse fix we are willing to suggest nearby areas. */
const NEARBY_RADIUS_KM = 25;

/**
 * Turn Photon's reverse results into a deduplicated, nearest-first list.
 * Photon ignores `layer` reliably but honours `radius`, so distance is checked
 * here too before we offer a candidate as a pickup area.
 */
export function toNearbyPlaces(
  features: PhotonFeature[],
  center: GeoPoint,
  maxDistanceKm = NEARBY_RADIUS_KM,
): Place[] {
  const seen = new Set<string>();
  const candidates: Array<{ place: Place; distance: number }> = [];

  for (const feature of features) {
    const [lng, lat] = feature.geometry?.coordinates ?? [];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    // Skip points of interest (banks, shops, fuel stations): they collapse to
    // the same area name and are not useful as pickup neighbourhoods.
    if (feature.properties.osm_key && POI_KEYS.has(feature.properties.osm_key)) continue;

    const place = toPlace(feature);
    const key = place.label.toLowerCase();
    if (seen.has(key)) continue;

    const distance = haversineKm(center, { lat, lng });
    if (distance > maxDistanceKm) continue;

    seen.add(key);
    candidates.push({ place, distance });
  }

  return candidates.sort((a, b) => a.distance - b.distance).map(({ place }) => place);
}

/** Nearby villages, landmarks and areas around an approximate device fix. */
export async function nearbyPlaces(point: GeoPoint, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({
    lon: String(point.lng),
    lat: String(point.lat),
    limit: "12",
    radius: String(NEARBY_RADIUS_KM),
    lang: "en",
  });

  try {
    const response = await fetch(`${GEOCODER_URL}/reverse?${params.toString()}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);

    const body = (await response.json()) as { features?: PhotonFeature[] };
    return toNearbyPlaces(body.features ?? [], point);
  } catch {
    return [];
  }
}

export function distanceBetween(from: GeoPoint, to: GeoPoint): number {
  return haversineKm(from, to);
}
