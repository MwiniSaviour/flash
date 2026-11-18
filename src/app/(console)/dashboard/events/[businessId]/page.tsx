import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AddEventForm } from "@/components/dashboard/AddEventForm";
import { ApprovalNotice } from "@/components/dashboard/ApprovalNotice";
import { ConsoleHeader } from "@/components/dashboard/ConsoleHeader";
import { ConsoleShell } from "@/components/dashboard/ConsoleShell";
import { OfferEditor } from "@/components/dashboard/OfferEditor";
import { PriceEditor } from "@/components/dashboard/PriceEditor";
import { TicketQueue } from "@/components/dashboard/TicketQueue";
import { EmptyState, StatusBadge } from "@/components/flash/ui";
import { hasCloudinaryEnv } from "@/lib/env";
import { dayMonth, timeRange } from "@/lib/flash/format";
import {
  getOwnedBusiness,
  listBusinesses,
  listEventsForBusiness,
  listIncomingTickets,
} from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Your events",
  description: "The events you promote, what tickets cost and who is coming.",
};

/**
 * One events company's console.
 *
 * The business id in the URL picks the company; every event and ticket below is
 * read through that id. Another company on the same account has its own page.
 */
export default async function EventsConsolePage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const [business, businesses] = await Promise.all([
    getOwnedBusiness(businessId, "events"),
    listBusinesses(),
  ]);

  if (!business) notFound();

  const events = await listEventsForBusiness(businessId);
  const event = events[0];

  if (!event) {
    return (
      <ConsoleShell kind="events" businesses={businesses} currentId={business.id}>
        <EmptyState
          message="This company has not posted an event yet. Post one and the tickets start selling."
          action="Back to your dashboard"
          href="/dashboard"
        />
      </ConsoleShell>
    );
  }

  const tickets = await listIncomingTickets(events.map((entry) => entry.id));

  return (
    <ConsoleShell kind="events" businesses={businesses} currentId={business.id}>
      <ConsoleHeader
        kind="events"
        title={event.title}
        linkHref={`/events/${event.slug}`}
        linkLabel="See your event page"
        businesses={businesses}
        currentId={business.id}
      />

      <div className="mt-5">
        <ApprovalNotice business={business} />
      </div>

      <section id="tickets" className="mt-6 scroll-mt-5">
        <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">Tickets</h2>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          Sold tickets, waiting for a yes. A ticket is not a booking until you confirm it.
        </p>
        <div className="mt-3">
          <TicketQueue tickets={tickets} />
        </div>
      </section>

      <section id="events" className="mt-7 scroll-mt-5 pb-8">
        <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">Your events</h2>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          What is coming up and what a ticket costs.
        </p>

        <ul className="mt-3 space-y-2.5">
          {events.map((entry) => (
            <li key={entry.id} className="rounded-[16px] border border-line/90 bg-surface p-3.5">
              <div className="flex items-start gap-3">
                <span className="relative block h-[56px] w-[56px] shrink-0 overflow-hidden rounded-[12px] bg-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.image.src}
                    alt={entry.image.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold tracking-[-0.015em] text-ink">
                    {entry.title}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-muted">
                    {dayMonth(entry.date)} &middot; {timeRange(entry.startTime, entry.endTime)}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-muted">{entry.venue}</span>
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {entry.tiers.map((tier) => (
                  <li
                    key={tier.id}
                    className="border-t border-line/70 pt-2.5 first:border-t-0 first:pt-0"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-semibold text-ink">
                          {tier.name}
                        </span>
                        <span className="mt-0.5 block text-[12px] text-muted">
                          {tier.available} left
                        </span>
                      </span>
                    </div>
                    <div className="mt-2">
                      <PriceEditor id={tier.id} kind="tier" price={tier.price} label={tier.name} />
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-3 border-t border-line/70 pt-3">
                <p className="text-[12px] font-semibold text-muted">This week&rsquo;s offer</p>
                <div className="mt-2">
                  <OfferEditor kind="event" id={entry.id} percent={entry.discount?.percent ?? 0} />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3">
          <AddEventForm businessId={business.id} canUpload={hasCloudinaryEnv()} />
        </div>

        <div className="mt-7 flex items-center gap-2 rounded-[14px] border border-line/90 bg-surface px-3.5 py-3">
          <StatusBadge tone="success" icon="check">
            Published
          </StatusBadge>
          <span className="text-[12.5px] text-muted">
            {event.going} of {event.capacity} tickets gone
          </span>
        </div>
      </section>
    </ConsoleShell>
  );
}
