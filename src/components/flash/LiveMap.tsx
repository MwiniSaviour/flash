"use client";

import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import type { GeoPoint } from "@/lib/flash/geo";
import { searchPlaces } from "@/lib/flash/places";

const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/liberty";

function along(from: GeoPoint, to: GeoPoint, progress: number): GeoPoint {
  const t = Math.min(1, Math.max(0, progress));
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  };
}

/**
 * Real vector tiles streamed from a CDN, with markers at the customer's
 * places. When only labels are known they are resolved through the same live
 * geocoder as address search, so nothing on the map is drawn from imagination.
 * The connecting line is a straight estimate; no road route is claimed until
 * the dispatch engine supplies one.
 */
export function LiveMap({
  from,
  to,
  fromLabel,
  toLabel,
  progress = 0,
  className,
}: {
  from?: GeoPoint;
  to?: GeoPoint;
  fromLabel?: string;
  toLabel?: string;
  progress?: number;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState<GeoPoint | undefined>(from);
  const [end, setEnd] = useState<GeoPoint | undefined>(to);
  const [unavailable, setUnavailable] = useState(false);
  const fromLat = from?.lat;
  const fromLng = from?.lng;
  const toLat = to?.lat;
  const toLng = to?.lng;

  useEffect(() => {
    let cancelled = false;

    const resolve = async (label?: string): Promise<GeoPoint | undefined> => {
      if (!label?.trim()) return undefined;
      const places = await searchPlaces(label);
      const first = places[0];
      return first ? { lat: first.lat, lng: first.lng } : undefined;
    };

    void Promise.all([resolve(fromLabel), resolve(toLabel)]).then(([geocodedFrom, geocodedTo]) => {
      if (cancelled) return;
      const a = fromLat !== undefined && fromLng !== undefined
        ? { lat: fromLat, lng: fromLng }
        : geocodedFrom;
      const b = toLat !== undefined && toLng !== undefined
        ? { lat: toLat, lng: toLng }
        : geocodedTo;
      setStart(a);
      setEnd(b);
      setUnavailable(!a || !b);
    });

    return () => {
      cancelled = true;
    };
  }, [fromLat, fromLng, toLat, toLng, fromLabel, toLabel]);

  useEffect(() => {
    if (!start || !end || unavailable || !container.current) return;

    let map: MapLibreMap | null = null;
    let cancelled = false;

    void import("maplibre-gl").then(({ Map, Marker, setWorkerUrl }) => {
      if (cancelled || !container.current) return;

      // Webpack renames the library bundle, so MapLibre cannot infer where its
      // worker lives. Point it at the emitted worker asset explicitly.
      setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);

      map = new Map({
        container: container.current,
        style: STYLE_URL,
        center: [(start.lng + end.lng) / 2, (start.lat + end.lat) / 2],
        zoom: 12,
      });

      map.on("load", () => {
        if (!map) return;
        map.addSource("flash-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [start.lng, start.lat],
                [end.lng, end.lat],
              ],
            },
          },
        });
        map.addLayer({
          id: "flash-route",
          type: "line",
          source: "flash-route",
          paint: {
            "line-color": "#fc5303",
            "line-width": 3,
            "line-dasharray": [2, 2],
          },
        });

        new Marker().setLngLat([start.lng, start.lat]).addTo(map);
        new Marker().setLngLat([end.lng, end.lat]).addTo(map);

        const rider = along(start, end, progress);
        const dot = document.createElement("div");
        dot.className = "h-3.5 w-3.5 rounded-full bg-brand ring-2 ring-white shadow-raised";
        new Marker({ element: dot }).setLngLat([rider.lng, rider.lat]).addTo(map);

        map.fitBounds(
          [
            [start.lng, start.lat],
            [end.lng, end.lat],
          ],
          { padding: 42, maxZoom: 13 },
        );
      });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [start, end, progress, unavailable]);

  return (
    <div className={className} aria-label="Map of the journey">
      <div ref={container} className="h-full w-full" />
      {unavailable ? (
        <p className="grid h-full place-items-center text-[12.5px] text-muted">
          Map data is unavailable right now.
        </p>
      ) : null}
    </div>
  );
}
