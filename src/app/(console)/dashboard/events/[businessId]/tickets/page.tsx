import type { Metadata } from "next";

import { TicketsTable } from "@/components/dashboard/ConsoleTables";
import { listEventsForBusiness, listIncomingTickets } from "@/lib/flash/repository";

export const metadata: Metadata = { title: "Tickets" };

export default async function EventsTicketsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const events = await listEventsForBusiness(businessId);
  const tickets = await listIncomingTickets(events.map((entry) => entry.id));

  return (
    <>
      <h1 className="sr-only">Tickets</h1>
      <div className="mt-6">
        <TicketsTable tickets={tickets} events={events} />
      </div>
    </>
  );
}
