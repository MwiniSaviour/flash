import type { Metadata } from "next";

import { EventsTable } from "@/components/dashboard/ConsoleTables";
import { hasDatabaseAdminEnv } from "@/lib/env";
import { DEMO_TODAY } from "@/lib/flash/format";
import { getOwnedBusiness, listEventsForBusiness } from "@/lib/flash/repository";

export const metadata: Metadata = { title: "Events" };

export default async function EventsEventsPage({
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

  const today = hasDatabaseAdminEnv() ? new Date().toISOString().slice(0, 10) : DEMO_TODAY;

  return (
    <>
      <h1 className="sr-only">Events</h1>
      <div className="mt-6">
        <EventsTable businessId={business.id} events={events} today={today} />
      </div>
    </>
  );
}
