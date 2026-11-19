import type { Metadata } from "next";

import { EventsCheckout } from "@/components/events/EventsCheckout";

export const metadata: Metadata = {
  title: "Ticket checkout",
  description: "All the tickets you have chosen, in one checkout.",
};

export default function EventCheckoutPage() {
  return <EventsCheckout />;
}
