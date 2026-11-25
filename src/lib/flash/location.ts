import { haversineKm, type GeoPoint } from "./geo";

/**
 * The customer's service area.
 *
 * A cached city is rendered immediately; a background position check then
 * refreshes it. When permission is denied the last known city stays in use,
 * and with no city at all the app serves every area it has.
 */

export const LOCATION_COOKIE = "flash_city";
export const LOCATION_CACHE_KEY = "flash:location:v1";
export const LOCATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const RADIUS_KM = 30;

export type UserLocation = {
  city: string | null;
  point: GeoPoint;
  accuracy: number | null;
  at: number;
};

export type LocationStatus = "loading" | "ready" | "denied" | "cached";

let citySnapshot: string | null = null;
let statusSnapshot: LocationStatus = "loading";
const listeners = new Set<() => void>();

export function subscribeLocation(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCitySnapshot(): string | null {
  return citySnapshot;
}

export function getStatusSnapshot(): LocationStatus {
  return statusSnapshot;
}

export function getServerCitySnapshot(): string | null {
  return null;
}

export function getServerStatusSnapshot(): LocationStatus {
  return "loading";
}

export function publishCity(city: string | null): void {
  if (citySnapshot === city) return;
  citySnapshot = city;
  listeners.forEach((listener) => listener());
}

export function publishStatus(status: LocationStatus): void {
  if (statusSnapshot === status) return;
  statusSnapshot = status;
  listeners.forEach((listener) => listener());
}

export function parseCity(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const city = input.trim();
  return city.length > 0 && city.length <= 80 ? city : null;
}

export function readCachedLocation(): UserLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<UserLocation>;
    if (
      typeof value.point?.lat !== "number" ||
      typeof value.point?.lng !== "number" ||
      typeof value.at !== "number"
    ) return null;
    if (Date.now() - value.at > LOCATION_TTL_MS) return null;
    return {
      city: parseCity(value.city),
      point: value.point,
      accuracy: typeof value.accuracy === "number" ? value.accuracy : null,
      at: value.at,
    };
  } catch {
    return null;
  }
}

export function writeCachedLocation(location: UserLocation): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
    if (location.city) {
      document.cookie = `${LOCATION_COOKIE}=${encodeURIComponent(location.city)}; max-age=${Math.floor(LOCATION_TTL_MS / 1000)}; path=/; SameSite=Lax`;
    } else {
      document.cookie = `${LOCATION_COOKIE}=; max-age=0; path=/; SameSite=Lax`;
    }
  } catch {
    // Blocked storage must not stop the background location check.
  }
}

export function clearLocationCookie(): void {
  if (typeof window === "undefined") return;
  document.cookie = `${LOCATION_COOKIE}=; max-age=0; path=/; SameSite=Lax`;
}

/** A place belongs to the user's area when its city or neighbourhood names it. */
export function matchesCity(city: string | null, place: string | null): boolean {
  if (!city) return true;
  if (!place) return false;
  const needle = city.trim().toLowerCase();
  const haystack = place.trim().toLowerCase();
  return haystack === needle || haystack.includes(needle) || needle.includes(haystack);
}

/** Distance is used only when the geocoder has no city label for a row. */
export function withinRadius(point: GeoPoint | null, place: GeoPoint | null): boolean {
  if (!point || !place) return false;
  return haversineKm(point, place) <= RADIUS_KM;
}

export function filterByCity<T>(
  items: T[],
  city: string | null,
  placeOf: (item: T) => string | null,
): T[] {
  if (!city) return items;
  return items.filter((item) => matchesCity(city, placeOf(item)));
}
