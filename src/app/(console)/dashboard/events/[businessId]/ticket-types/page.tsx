import type { Metadata } from "next";

import { TiersTable } from "@/components/dashboard/ConsoleTables";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { DEMO_TODAY } from "@/lib/flash/format";
import { getOwnedBusiness, listEventsForBusiness } from "@/lib/flash/repository";

export const metadata: Metadata = { title: "Ticket types" };

export default async function EventsTiersPage({
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

  const today = hasSupabaseAdminEnv() ? new Date().toISOString().slice(0, 10) : DEMO_TODAY;

  return (
    <>
      <h1 className="sr-only">Ticket types</h1>
      <div className="mt-6">
        <TiersTable businessId={business.id} events={events} today={today} />
      </div>
    </>
  );
}
