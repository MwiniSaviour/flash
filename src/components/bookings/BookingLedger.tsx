"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Icon, type IconName } from "@/components/flash/Icon";
import { SegmentedControl } from "@/components/flash/SegmentedControl";
import { EmptyState, ScreenHeader, StatusBadge } from "@/components/flash/ui";
import { cedis, relativeDay } from "@/lib/flash/format";
import { TicketRow } from "@/components/tickets/TicketRow";
import type { Booking, BookingKind, BookingStatus, Event, Ticket } from "@/lib/flash/types";

type Filter = "all" | BookingKind;

const kindIcons: Record<BookingKind, IconName> = {
  ticket: "ticket",
  ride: "ride",
  order: "bag",
};

const statusMap: Record<BookingStatus, { tone: "success" | "warning" | "neutral" | "danger"; label: string; icon: IconName }> = {
  confirmed: { tone: "success", label: "Confirmed", icon: "check-circle" },
  pending: { tone: "warning", label: "Pending", icon: "clock" },
  completed: { tone: "neutral", label: "Completed", icon: "check" },
  cancelled: { tone: "danger", label: "Cancelled", icon: "close" },
};

/**
 * Bookings: every commitment in one ledger.
 *
 * Tickets, rides and orders sit in the same list because they are the same
 * kind of thing to the customer — something they have booked. The filter chips
 * narrow the list by service.
 */
export function BookingLedger({
  bookings,
  tickets = [],
  events = [],
}: {
  bookings: Booking[];
  tickets?: Ticket[];
  events?: Event[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(
    () => (filter === "all" ? bookings : bookings.filter((booking) => booking.kind === filter)),
    [bookings, filter],
  );

  /**
   * Event tickets get the wallet's own row: the tier, the state and the date
   * chip are the things a ticket holder looks for.
   */
  const ticketRows = useMemo(() => {
    const eventById = new Map(events.map((event) => [event.id, event]));

    return tickets
      .map((ticket) => ({ ticket, event: eventById.get(ticket.eventId) }))
      .filter((row): row is { ticket: Ticket; event: Event } => Boolean(row.event));
  }, [events, tickets]);

  const counts = useMemo(
    () => ({
      ride: bookings.filter((booking) => booking.kind === "ride").length,
      order: bookings.filter((booking) => booking.kind === "order").length,
      ticket: bookings.filter((booking) => booking.kind === "ticket").length,
    }),
    [bookings],
  );

  return (
    <div className="pb-5">
      <ScreenHeader
        title="Bookings"
        subtitle="Every ticket, ride and order you have made."
        className="pt-2"
      />

      <div className="mt-3.5 px-5">
        <SegmentedControl
          ariaLabel="Filter bookings"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: bookings.length },
            { value: "ticket", label: "Tickets", count: counts.ticket },
            { value: "ride", label: "Rides", count: counts.ride },
            { value: "order", label: "Orders", count: counts.order },
          ]}
        />
      </div>

      <ul className="mt-3.5 space-y-2.5 px-5">
        {filter === "ticket"
          ? ticketRows.map(({ ticket, event }) => (
              <li key={ticket.id}>
                <TicketRow ticket={ticket} event={event} />
              </li>
            ))
          : visible.map((booking) => {
              const status = statusMap[booking.status];

              return (
                <li key={booking.id}>
                  <Link
                    href={booking.href}
                    className="flex w-full items-start gap-3 rounded-[14px] border border-line/90 bg-surface p-2.5 transition hover:border-line-strong active:scale-[0.99]"
                  >
                    <span className="relative block h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[12px] bg-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={booking.image.src}
                        alt={booking.image.alt}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute bottom-1 left-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                        <Icon name={kindIcons[booking.kind]} size={12} />
                      </span>
                    </span>

                    <span className="min-w-0 flex-1 py-0.5">
                      <span className="block truncate text-[15px] font-semibold leading-tight tracking-[-0.015em] text-ink">
                        {booking.title}
                      </span>
                      <span className="mt-1 block truncate text-[12.5px] text-muted">
                        {booking.subtitle}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">
                        <span>{relativeDay(booking.when)}</span>
                        <span className="h-[3px] w-[3px] rounded-full bg-muted-soft" aria-hidden="true" />
                        <span>{cedis(booking.price)}</span>
                      </span>

                      <span className="mt-2 flex items-center gap-2">
                        <StatusBadge tone={status.tone} icon={status.icon}>
                          {status.label}
                        </StatusBadge>
                        <span className="truncate font-mono text-[11px] tracking-[0.04em] text-muted-soft">
                          {booking.reference}
                        </span>
                      </span>
                    </span>

                    <Icon name="chevron-right" size={17} className="mt-8 shrink-0 text-muted-soft" />
                  </Link>
                </li>
              );
            })}
      </ul>

      {visible.length === 0 && filter !== "ticket" ? (
        <div className="px-5">
          <EmptyState message="Nothing booked here yet." />
        </div>
      ) : null}

      {filter === "ticket" && ticketRows.length === 0 ? (
        <div className="px-5">
          <EmptyState message="No tickets yet. Book an event and it lands here." href="/events" action="Browse events" />
        </div>
      ) : null}
    </div>
  );
}
