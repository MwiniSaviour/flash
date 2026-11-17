import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Icon } from "~/components/ui/Icon";
import { ScalmintFooter } from "~/components/layout/ScalmintFooter";
import { DateBadge, ScreenHeader, StatusBadge } from "~/components/ui/primitives";
import { useContent } from "~/content/ContentProvider";
import { cn } from "~/lib/cn";
import { dateBadge, distance } from "~/lib/format";
import { mediaUrl } from "~/lib/api";

type Tab = "upcoming" | "past";

/**
 * My Tickets: segmented Upcoming/Past wallet, each row led by the event's
 * artwork and date chip, with the tier, state badge and a link to the event.
 */
export function TicketsScreen() {
  const navigate = useNavigate();
  const { tickets, getEventForTicket } = useContent();
  const [tab, setTab] = useState<Tab>("upcoming");

  const rows = useMemo(
    () =>
      tickets
        .map((ticket) => ({ ticket, event: getEventForTicket(ticket) }))
        .filter((row) => row.event)
        .filter((row) => (tab === "past" ? row.ticket.status === "past" : row.ticket.status !== "past")),
    [getEventForTicket, tab, tickets],
  );

  return (
    <div className="pb-4">
      <ScreenHeader title="My Tickets" subtitle="Your upcoming and past events." className="pt-0.5" />

      <div className="mt-3.5 px-5">
        <div className="flex rounded-[4px] bg-surface-3/70 p-[2px]" role="tablist" aria-label="Ticket history">
          {(["upcoming", "past"] as const).map((value) => {
            const isActive = tab === value;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setTab(value)}
                className={cn(
                  "h-[35px] flex-1 rounded-[4px] text-[13px] font-semibold capitalize transition",
                  isActive
                    ? "bg-brand text-white shadow-[0_6px_16px_-8px_rgb(252_83_3/0.9)]"
                    : "text-[#3c4657]",
                )}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="mt-3.5 space-y-2.5 px-5">
        {rows.map(({ ticket, event }) => {
          if (!event) return null;
          const badge = dateBadge(event.date);
          return (
            <li key={ticket.id}>
              <button
                type="button"
                onClick={() => navigate(`/events/${event.slug}`)}
                className="flex w-full items-start gap-3 rounded-[4px] border border-line/90 bg-surface/70 p-2 text-left shadow-[0_1px_2px_rgb(23_26_31/0.03)] transition active:scale-[0.99]"
              >
                <span className="relative block h-[96px] w-[86px] shrink-0 overflow-hidden rounded-[4px] bg-media">
                  <img
                    src={mediaUrl(event.image.src)}
                    alt={event.image.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                  <DateBadge {...badge} size="sm" tone="glass" className="absolute left-1 top-1" />
                </span>

                <span className="min-w-0 flex-1 pt-0.5">
                  <span className="block truncate text-[15px] font-semibold leading-tight tracking-[-0.015em] text-ink">
                    {event.title}
                  </span>
                  <span className="mt-[3px] flex items-center gap-1 text-[12px] leading-snug text-muted">
                    <span className="truncate">
                      {event.venue}, {event.city}
                    </span>
                    <span className="mx-0.5 h-[3px] w-[3px] shrink-0 rounded-full bg-muted-soft" />
                    <span className="shrink-0">{distance(event.distanceKm)}</span>
                  </span>
                  {/* The mock lists the tier as plain muted text, not a chip. */}
                  <span className="mt-[5px] block truncate text-[12.5px] leading-snug text-muted">
                    {ticket.tierName}
                  </span>
                  <span className="mt-[7px] block">
                    <StatusBadge status={ticket.status} />
                  </span>
                </span>

                <Icon
                  name="chevron-right"
                  size={18}
                  className="mr-0.5 shrink-0 self-center text-muted-soft"
                />
              </button>
            </li>
          );
        })}
      </ul>

      {rows.length === 0 ? (
        <p className="mx-5 mt-8 rounded-2xl border border-dashed border-line-strong/70 px-4 py-8 text-center text-[13px] leading-relaxed text-muted">
          {tab === "past"
            ? "No past tickets yet. Events you have attended will show up here."
            : "No upcoming tickets. Browse Events to find something on soon."}
        </p>
      ) : null}

      <ScalmintFooter className="mt-5" />

      <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className={cn(
              "h-[5px] rounded-full transition-all",
              dot === 0 ? "w-[5px] bg-ink/45" : "w-[5px] bg-ink/15",
            )}
          />
        ))}
      </div>
    </div>
  );
}
