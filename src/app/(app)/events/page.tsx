import type { Metadata } from "next";

import { EventsBrowser } from "@/components/events/EventsBrowser";
import { getUpcomingEvents } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Events",
  description: "Concerts, comedy, festivals and food nights near you in Accra.",
};

export default async function EventsPage() {
  const events = await getUpcomingEvents();

  return <EventsBrowser events={events} />;
}
