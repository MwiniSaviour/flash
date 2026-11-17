import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { DateBadge, StatusBadge } from "@/components/flash/ui";
import { dateBadge, distance } from "@/lib/flash/format";
import type { Event, Ticket } from "@/lib/flash/types";

/**
 * One event ticket in the wallet: the event's artwork and date chip, then the
 * tier, the state and the link through to the event.
 */
export function TicketRow({ ticket, event }: { ticket: Ticket; event: Event }) {
  const badge = dateBadge(event.date);

  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="flex w-full items-start gap-3 rounded-[14px] border border-line/90 bg-surface p-2.5 transition hover:border-line-strong active:scale-[0.99]"
    >
      <span className="relative block h-[98px] w-[88px] shrink-0 overflow-hidden rounded-[10px] bg-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.image.src}
          alt={event.image.alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <DateBadge {...badge} size="sm" tone="glass" className="absolute left-1 top-1" />
      </span>

      <span className="min-w-0 flex-1 py-0.5">
        <span className="block truncate text-[15.5px] font-semibold leading-tight tracking-[-0.015em] text-ink">
          {event.title}
        </span>
        <span className="mt-[4px] flex items-center gap-1 text-[12.5px] leading-snug text-muted">
          <span className="truncate">{event.venue}</span>
          <span className="mx-0.5 h-[3px] w-[3px] shrink-0 rounded-full bg-muted-soft" />
          <span className="shrink-0">{distance(event.distanceKm)}</span>
        </span>
        <span className="mt-[6px] block truncate text-[12.5px] leading-snug text-muted">
          {ticket.tierName} × {ticket.quantity}
        </span>
        <span className="mt-2 block">
          {ticket.status === "confirmed" ? (
            <StatusBadge tone="success" icon="check-circle">
              Confirmed
            </StatusBadge>
          ) : ticket.status === "pending" ? (
            <StatusBadge tone="warning" icon="clock">
              Pending
            </StatusBadge>
          ) : (
            <StatusBadge tone="neutral" icon="check">
              Attended
            </StatusBadge>
          )}
        </span>
      </span>

      <Icon name="chevron-right" size={18} className="mt-8 shrink-0 text-muted-soft" />
    </Link>
  );
}
