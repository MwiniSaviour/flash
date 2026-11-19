import type { Metadata } from "next";

import { ProfilePageHeader } from "@/components/dashboard/ProfilePageHeader";
import { TicketRow } from "@/components/tickets/TicketRow";
import { EmptyState } from "@/components/flash/ui";
import { listEvents, listTickets } from "@/lib/flash/repository";

export const metadata: Metadata = { title: "My tickets" };

export default async function TicketsPage() {
  const [tickets, events] = await Promise.all([listTickets(), listEvents()]);

  return (
    <>
      <ProfilePageHeader
        title="My tickets"
        subtitle="Your event passes and their confirmation status."
      />

      <section className="mt-5 px-5">
        {tickets.length ? (
          <ul className="space-y-2.5">
            {tickets.map((ticket) => {
              const event = events.find((entry) => entry.id === ticket.eventId);
              if (!event) return null;
              return (
                <li key={ticket.id}>
                  <TicketRow ticket={ticket} event={event} />
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            message="You have no tickets yet. Find an event and get a pass."
            action="Browse events"
            href="/events"
          />
        )}
      </section>
    </>
  );
}
