/** A geographic point in WGS84 degrees. */
export type GeoPoint = { lat: number; lng: number };

/** Great-circle distance in kilometres. Road distance comes later. */
export function haversineKm(from: GeoPoint, to: GeoPoint): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Journey minutes at a conservative urban speed, for an upfront estimate. */
export function estimateMinutes(distanceKm: number, averageKmh = 28): number {
  return Math.max(1, Math.round((distanceKm / averageKmh) * 60 + 3));
}
