"use client";

import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";

import type { GeoPoint } from "@/lib/flash/geo";

const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/liberty";

/**
 * Real vector tiles streamed from a CDN.
 *
 * Markers use the points the customer chose or their device location. The line
 * between them is a straight estimate until routed geometry lands; the map
 * never claims a road route that the engine did not compute.
 */
export function LiveMap({
  from,
  to,
  className,
}: {
  from?: GeoPoint;
  to?: GeoPoint;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const fromLat = from?.lat;
  const fromLng = from?.lng;
  const toLat = to?.lat;
  const toLng = to?.lng;

  useEffect(() => {
    let map: MapLibreMap | null = null;
    let cancelled = false;

    void import("maplibre-gl").then(({ Map, Marker }) => {
      if (cancelled || !container.current) return;

      const center: [number, number] = [fromLng ?? toLng ?? -2.5054, fromLat ?? toLat ?? 10.0623];
      map = new Map({
        container: container.current,
        style: STYLE_URL,
        center,
        zoom: fromLat !== undefined && toLat !== undefined ? 11 : 12,
      });

      if (fromLat !== undefined && fromLng !== undefined) {
        new Marker().setLngLat([fromLng, fromLat]).addTo(map);
      }
      if (toLat !== undefined && toLng !== undefined) {
        new Marker().setLngLat([toLng, toLat]).addTo(map);
      }
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [fromLat, fromLng, toLat, toLng]);

  return <div ref={container} className={className} aria-label="Map of the journey" />;
}
