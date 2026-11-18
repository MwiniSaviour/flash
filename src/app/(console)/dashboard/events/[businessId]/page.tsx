import type { Metadata } from "next";

import { ApprovalNotice } from "@/components/dashboard/ApprovalNotice";
import { ConsoleHeader } from "@/components/dashboard/ConsoleHeader";
import { ConsoleSectionLinks } from "@/components/dashboard/ConsoleSectionLinks";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { EmptyState } from "@/components/flash/ui";
import { cedis } from "@/lib/flash/format";
import {
  getOwnedBusiness,
  listCustomers,
  listEventsForBusiness,
  listIncomingTickets,
} from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Events overview",
  description: "The numbers behind this events company, and where to manage each part.",
};

export default async function EventsOverviewPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const [business, events] = await Promise.all([
    getOwnedBusiness(businessId, "events"),
    listEventsForBusiness(businessId),
  ]);

  if (!business) return null;

  if (!events.length) {
    return (
      <EmptyState
        message="This company has not posted an event yet. Post one from the Events page."
        href={`/dashboard/events/${businessId}/events`}
        action="Go to Events"
      />
    );
  }

  const [tickets, customers] = await Promise.all([
    listIncomingTickets(events.map((entry) => entry.id)),
    listCustomers(businessId, "events"),
  ]);

  const ticketsSold = tickets.reduce((total, ticket) => total + ticket.quantity, 0);
  const attendees = tickets
    .filter((ticket) => ticket.status === "confirmed" || ticket.status === "used")
    .reduce((total, ticket) => total + ticket.quantity, 0);
  const revenue = tickets.reduce((total, ticket) => {
    const event = events.find((entry) => entry.id === ticket.eventId);
    const tier = event?.tiers.find((entry) => entry.id === ticket.tierId);
    return total + (tier?.price ?? event?.priceFrom ?? 0) * ticket.quantity;
  }, 0);

  return (
    <>
      <ConsoleHeader title="Overview" description="Where this company stands right now." />

      <KpiCards
        cards={[
          {
            label: "Tickets sold",
            value: String(ticketsSold),
            icon: "ticket",
            tone: "brand",
            note: `${tickets.length} bookings`,
          },
          {
            label: "Revenue",
            value: cedis(revenue),
            icon: "banknote",
            tone: "success",
            note: "from these tickets",
          },
          {
            label: "Events",
            value: String(events.length),
            icon: "calendar",
            tone: "warning",
            note: "in this company",
          },
          {
            label: "Attendees",
            value: String(attendees),
            icon: "user",
            note: `${customers.length} people booked`,
          },
        ]}
      />

      <div className="mt-5">
        <ApprovalNotice business={business} />
      </div>

      <ConsoleSectionLinks kind="events" businessId={businessId} />
    </>
  );
}
