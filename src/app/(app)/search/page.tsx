import type { Metadata } from "next";

import { SearchScreen } from "@/components/search/SearchScreen";
import { filterByCity } from "@/lib/flash/location";
import { currentCity } from "@/lib/flash/location-server";
import { listEvents, listRestaurants } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, events, restaurants] = await Promise.all([
    searchParams,
    listEvents(),
    listRestaurants(),
  ]);

  // An explicit query searches the whole country. With no query the screen
  // obeys the customer's area like the other storefronts.
  const city = q?.trim() ? null : await currentCity();
  const nearbyEvents = filterByCity(events, city, (event) => event.city ?? event.neighbourhood);
  const nearbyRestaurants = filterByCity(restaurants, city, (restaurant) => restaurant.neighbourhood);

  return (
    <SearchScreen
      events={nearbyEvents}
      restaurants={nearbyRestaurants}
      initialQuery={q ?? ""}
    />
  );
}
