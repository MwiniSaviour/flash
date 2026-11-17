import type { Metadata } from "next";
import Link from "next/link";

import { AddEventForm } from "@/components/dashboard/AddEventForm";
import { ApprovalNotice } from "@/components/dashboard/ApprovalNotice";
import { OfferEditor } from "@/components/dashboard/OfferEditor";
import { PriceEditor } from "@/components/dashboard/PriceEditor";
import { TicketQueue } from "@/components/dashboard/TicketQueue";
import { Icon } from "@/components/flash/Icon";
import { hasCloudinaryEnv } from "@/lib/env";
import { EmptyState, StatusBadge } from "@/components/flash/ui";
import { listBusinesses, listIncomingTickets, listMyEvents } from "@/lib/flash/repository";
import { dayMonth, timeRange } from "@/lib/flash/format";

export const metadata: Metadata = {
  title: "Your events",
  description: "The events you promote, what tickets cost and who is coming.",
};

/**
 * The events console.
 *
 * A promoter opens this between announcements, so the screen answers in
 * order: who has bought a ticket and is waiting for a yes, what you have
 * coming up and what it costs, and what is on offer this week.
 */
export default async function EventsConsolePage() {
  const [events, businesses] = await Promise.all([listMyEvents(), listBusinesses()]);
  const event = events[0];
  const business = businesses.find((entry) => entry.kind === "events");

  if (!event) {
    return (
      <div className="px-5 pt-8">
        <EmptyState
          message="You have not posted an event yet. Post one and the tickets start selling."
          action="Post an event"
          href="/dashboard/events"
        />
      </div>
    );
  }

  const tickets = await listIncomingTickets(events.map((entry) => entry.id));

  return (
    <div className="pb-8">
      <header className="px-5 pt-4">
        <p className="text-[12.5px] font-medium text-muted">Your events</p>
        <h1 className="mt-0.5 text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          {event.title}
        </h1>
        <Link
          href={`/events/${event.slug}`}
          className="mt-2 inline-flex items-center gap-1 text-[13.5px] font-bold text-brand-ink transition-colors hover:text-brand"
        >
          See your event page
          <Icon name="chevron-right" size={13} />
        </Link>
      </header>

      {business ? (
        <div className="mt-5 px-5">
          <ApprovalNotice business={business} />
        </div>
      ) : null}

      <section className="mt-6 px-5">
        <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">Tickets</h2>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          Sold tickets, waiting for a yes. A ticket is not a booking until you confirm it.
        </p>
        <div className="mt-3">
          <TicketQueue tickets={tickets} />
        </div>
      </section>

      <section className="mt-7 px-5">
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
          <AddEventForm canUpload={hasCloudinaryEnv()} />
        </div>
      </section>

      <section className="mt-7 px-5">
        <div className="flex items-center gap-2 rounded-[14px] border border-line/90 bg-surface px-3.5 py-3">
          <StatusBadge tone="success" icon="check">
            Published
          </StatusBadge>
          <span className="text-[12.5px] text-muted">
            {event.going} of {event.capacity} tickets gone
          </span>
        </div>
      </section>
    </div>
  );
}
