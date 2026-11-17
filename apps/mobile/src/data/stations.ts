/**
 * Fictional demo data for UI prototyping — the one station this app is built
 * around. The frequency, city and tagline are invented for the prototype; the
 * artwork is generated placeholder art (see docs/assets-provenance.md). The
 * stream ships empty on purpose: a real broadcaster feed needs licensing sorted
 * first (docs/live-audio-backend-research.md).
 *
 * This module is the single source of truth for both the Payload seed
 * (scripts/seed.ts) and the mobile app's offline fallback, mirroring the
 * convention used by src/data/shows.ts.
 *
 * There is exactly one station: Prototype FM. The schedule, player and profile
 * all resolve through this list, so the app cannot drift into showing a dial of
 * stations it does not have.
 */

import type { Station } from "~/lib/types";

export const stations: Station[] = [
  {
    id: "station-prototype-fm",
    slug: "prototype-fm",
    name: "Prototype FM",
    frequency: "102.5 FM",
    city: "Wa",
    tagline: "The Voice of Wa",
    artwork: {
      src: "/assets/images/prototype-fm-artwork.jpg",
      alt: "Wa's main street in the afternoon",
    },
    // The seed and the app both read a station stream from the environment at
    // their own boundary (Next: NEXT_PUBLIC_STREAM_URL, Vite: VITE_STREAM_URL),
    // so this shared fixture stays framework-agnostic.
    streamUrl: "",
    flagship: true,
    live: true,
  },
];

const stationsBySlug = new Map(stations.map((station) => [station.slug, station]));

export function getStationBySlug(slug: string): Station | undefined {
  return stationsBySlug.get(slug);
}

/** The station the app boots into — the only one there is. */
export const flagshipStation: Station =
  stations.find((station) => station.flagship) ?? stations[0];
