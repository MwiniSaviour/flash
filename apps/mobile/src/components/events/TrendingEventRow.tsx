import { Icon } from "~/components/ui/Icon";
import { mediaUrl } from "~/lib/api";
import { dateBadge, timeRange } from "~/lib/format";
import type { EventItem } from "~/lib/types";

/**
 * "Trending Now": the event people are actually booking, in the row design from
 * the reference — artwork on the left, title, venue, then a clock and the time
 * range on one line.
 *
 * It used to be a show with a play button. Events are not playable, so the row
 * opens the event instead and the trailing control is a chevron; the artwork and
 * type rhythm stay as drawn.
 */
export function TrendingEventRow({
  event,
  booked,
  onSelect,
}: {
  event: EventItem;
  /** Tickets booked so far, shown so the row explains why it is trending. */
  booked: number;
  onSelect: () => void;
}) {
  const badge = dateBadge(event.date);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${event.title}, ${badge.weekday} ${badge.day} ${badge.month}, ${event.venue}, ${booked} booked`}
      className="flex w-full items-center gap-3 rounded-[5px] border border-line/90 bg-surface/70 p-2 text-left transition active:scale-[0.99] active:bg-surface"
    >
      <span className="relative block h-[68px] w-[76px] shrink-0 overflow-hidden rounded-[4px] bg-media">
        <img
          src={mediaUrl(event.image.src)}
          alt={event.image.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-tight tracking-[-0.015em] text-ink">
          {event.title}
        </span>
        <span className="mt-[3px] block truncate text-[12.5px] leading-snug text-muted">
          <span className="truncate">
            {event.venue}, {event.city}
          </span>
        </span>
        <span className="mt-[4px] flex items-center gap-1 text-[12px] leading-snug text-muted">
          <Icon name="clock" size={12} className="shrink-0 text-muted" />
          {timeRange(event.startTime, event.endTime)}
        </span>
      </span>

      <span className="mr-0.5 flex shrink-0 flex-col items-end gap-1">
        <span className="rounded-full bg-brand-soft px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.08em] text-brand">
          {booked} booked
        </span>
        <Icon name="chevron-right" size={17} className="text-muted-soft" />
      </span>
    </button>
  );
}
