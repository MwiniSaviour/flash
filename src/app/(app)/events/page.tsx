import type { Metadata } from "next";

import { EventsBrowser } from "@/components/events/EventsBrowser";
import { currentCity } from "@/lib/flash/location-server";
import { filterByCity } from "@/lib/flash/location";
import { getUpcomingEvents } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Events",
  description: "Concerts, comedy, festivals and food nights in your city.",
};

export default async function EventsPage() {
  const city = await currentCity();
  const events = filterByCity(
    await getUpcomingEvents(),
    city,
    (event) => event.city ?? event.neighbourhood,
  );

  return <EventsBrowser events={events} city={city} />;
}
