import { Icon } from "~/components/ui/Icon";
import { DateBadge, Tag } from "~/components/ui/primitives";
import { cedis, dateBadge, distance } from "~/lib/format";
import { mediaUrl } from "~/lib/api";
import type { EventItem } from "~/lib/types";

/**
 * The "Nearby Events" row: a 92px thumbnail with a date chip pinned to its
 * corner, then title / venue / tags / price, with a chevron to the detail page.
 */
export function EventListCard({
  event,
  onSelect,
}: {
  event: EventItem;
  onSelect: () => void;
}) {
  const badge = dateBadge(event.date);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-start gap-3 rounded-[5px] border border-line/90 bg-surface/70 p-2 text-left shadow-[0_1px_2px_rgb(23_26_31/0.03)] transition active:scale-[0.99] active:bg-surface"
    >
      <span className="relative block h-[96px] w-[86px] shrink-0 overflow-hidden rounded-[4px] bg-media">
        <img
          src={mediaUrl(event.image.src)}
          alt={event.image.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
        <DateBadge {...badge} size="sm" className="absolute left-1 top-1" />
      </span>

      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block truncate text-[15px] font-semibold leading-tight tracking-[-0.015em] text-ink">
          {event.title}
        </span>
        <span className="mt-[2px] flex items-center gap-1 text-[11.5px] leading-snug text-muted">
          <span className="truncate">
            {event.venue}, {event.city}
          </span>
          <span className="mx-0.5 h-[3px] w-[3px] shrink-0 rounded-full bg-muted-soft" />
          <span className="shrink-0">{distance(event.distanceKm)}</span>
        </span>
        <span className="mt-1 flex flex-wrap gap-1">
          {event.tags.slice(0, 2).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </span>
        <span className="mt-1 block text-[11.5px] leading-none text-muted">
          from <span className="font-semibold text-brand">{cedis(event.priceFrom)}</span>
        </span>
      </span>

      <Icon name="chevron-right" size={18} className="mr-0.5 shrink-0 self-center text-muted-soft" />
    </button>
  );
}
