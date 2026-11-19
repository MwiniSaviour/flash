import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingCode } from "@/components/flash/BookingCode";
import { Icon } from "@/components/flash/Icon";
import { PassActions } from "@/components/flash/PassActions";
import { dayMonth, distance, timeRange } from "@/lib/flash/format";
import { getEventById, listTickets } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Your pass",
};

/**
 * The event pass.
 *
 * What a customer shows at the gate: the event, the tier, the venue, the time
 * and a code that is actually scannable. The reference is the ticket, so it is
 * set in tracked monospace and printed large enough to read across a table.
 */
export default async function TicketPassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tickets = await listTickets();
  const ticket = tickets.find((item) => item.id === id);

  if (!ticket) notFound();

  const event = await getEventById(ticket.eventId);
  if (!event) notFound();

  return (
    <div className="px-5 pb-6 pt-3">
      <header className="flex items-center gap-3">
        <Link
          href="/bookings"
          aria-label="Back to bookings"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink transition active:scale-95"
        >
          <Icon name="chevron-left" size={19} />
        </Link>
        <h1 className="text-[20px] font-bold tracking-[-0.02em] text-ink">Your pass</h1>
      </header>

      <article className="mt-4 overflow-hidden rounded-[20px] border border-line/90 bg-surface shadow-raised">
        <div className="bg-brand-solid px-4 py-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
            Flash event pass
          </p>
          <h2 className="mt-1.5 text-[21px] font-bold leading-tight tracking-[-0.02em]">
            {event.title}
          </h2>
          <p className="mt-1 text-[13px] text-white/85">
            {ticket.tierName} × {ticket.quantity}
          </p>
        </div>

        <div className="p-4">
          <dl className="grid grid-cols-3 gap-2">
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted">Date</dt>
              <dd className="mt-1 text-[13px] font-semibold text-ink">{dayMonth(event.date)}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted">Doors</dt>
              <dd className="mt-1 text-[13px] font-semibold text-ink">
                {timeRange(event.startTime, event.endTime).split(" – ")[0]}
              </dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted">Venue</dt>
              <dd className="mt-1 truncate text-[13px] font-semibold text-ink">{event.venue}</dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-line/80 pt-4">
            <BookingCode
              value={ticket.reference}
              caption="Show this code at the gate — it is scanned on your phone"
              className="mx-auto max-w-[220px]"
            />
          </div>

          <div className="mt-4 border-t border-line/80 pt-4">
            <div className="flex items-start gap-2.5">
              <Icon name="map-pin" size={16} className="mt-0.5 shrink-0 text-brand" />
              <div>
                <p className="text-[13.5px] font-semibold text-ink">{event.venue}</p>
                <p className="mt-0.5 text-[12.5px] text-muted">
                  {event.neighbourhood}, {event.city} · {distance(event.distanceKm)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(event.tiers.find((item) => item.id === ticket.tierId)?.perks ?? []).map((perk) => (
                <span
                  key={perk}
                  className="rounded-[6px] bg-surface-2 px-2 py-1 text-[11.5px] font-medium text-muted"
                >
                  {perk}
                </span>
              ))}
            </div>

            <p className="mt-3 text-[12px] text-muted-soft">
              Reference {ticket.reference} · purchased {ticket.purchasedAt.slice(0, 10)}
            </p>
          </div>
        </div>
      </article>
        <div className="mt-4">
        <PassActions reference={ticket.reference} title={`${event.title} — ${ticket.tierName}`} />
      </div>

      <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
        <Icon name="info" size={13} className="mt-0.5 shrink-0" />
        Keep this screen open when you arrive — the gate scans the code on your phone.
      </p>

      <Link
        href={`/events/${event.slug}`}
        className="mt-3 flex h-[46px] items-center justify-center gap-2 rounded-[12px] border border-line bg-surface text-[13.5px] font-semibold text-ink transition hover:border-line-strong"
      >
        Event details
        <Icon name="chevron-right" size={16} />
      </Link>
    </div>
  );
}
