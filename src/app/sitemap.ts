import type { MetadataRoute } from "next";

import { getEnv } from "@/lib/env";
import { listEvents, listRestaurants } from "@/lib/flash/repository";

export const revalidate = 3600;

/**
 * The sitemap: the five destinations plus every event and kitchen that can be
 * booked.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getEnv().siteUrl;

  // A paused database or an expired key must not fail the whole build: the
  // static routes still describe the app, and ISR picks the live ones up later.
  const [events, restaurants] = await Promise.all([
    listEvents().catch(() => []),
    listRestaurants().catch(() => []),
  ]);

  const staticRoutes = ["", "/events", "/food", "/ride", "/bookings"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const eventRoutes = events.map((event) => ({
    url: `${base}/events/${event.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const foodRoutes = restaurants.map((restaurant) => ({
    url: `${base}/food/${restaurant.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...eventRoutes, ...foodRoutes];
}
