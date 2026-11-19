import type { Metadata } from "next";

import { RequestQueue } from "@/components/admin/RequestQueue";
import { listTicketRequests } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Ticket requests",
  description: "People who wanted a ticket after an event sold out.",
};

/** Every sold-out request across the platform. */
export default async function RequestsPage() {
  const rows = await listTicketRequests();

  return (
    <div>
      <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
        Ticket requests
      </h1>
      <p className="mt-1.5 text-[13px] text-muted">
        Fulfil a request when the planner adds more slots.
      </p>

      <div className="mt-6">
        <RequestQueue rows={rows} />
      </div>
    </div>
  );
}
