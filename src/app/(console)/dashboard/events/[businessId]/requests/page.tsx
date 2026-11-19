import type { Metadata } from "next";

import { ConsoleHeader } from "@/components/dashboard/ConsoleHeader";
import { PlannerRequests } from "@/components/dashboard/PlannerRequests";
import {
  getOwnedBusiness,
  listEventsForBusiness,
  listTicketRequests,
} from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Ticket requests",
  description: "People asking for a place after an event sold out.",
};

/** Requests for this promoter's events only. */
export default async function PlannerRequestsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const business = await getOwnedBusiness(businessId, "events");
  if (!business) return null;

  const events = await listEventsForBusiness(businessId);
  const all = await listTicketRequests(events.map((event) => event.id));

  return (
    <>
      <ConsoleHeader
        title="Requests"
        description="Fulfil a request when you add more slots to a sold-out tier."
      />
      <div className="mt-5">
        <PlannerRequests rows={all} />
      </div>
    </>
  );
}
