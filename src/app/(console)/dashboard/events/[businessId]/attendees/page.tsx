import type { Metadata } from "next";

import { AttendeesTable } from "@/components/dashboard/ConsoleTables";
import { listCustomers } from "@/lib/flash/repository";

export const metadata: Metadata = { title: "Attendees" };

export default async function EventsAttendeesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const customers = await listCustomers(businessId, "events");

  return (
    <>
      <h1 className="sr-only">Attendees</h1>
      <div className="mt-6">
        <AttendeesTable customers={customers} />
      </div>
    </>
  );
}
