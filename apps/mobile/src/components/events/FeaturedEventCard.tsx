import { cn } from "~/lib/cn";
import { Icon } from "~/components/ui/Icon";
import { DateBadge, Tag } from "~/components/ui/primitives";
import { cedis, dateBadge, distance, timeRange } from "~/lib/format";
import { mediaUrl } from "~/lib/api";
import type { EventItem } from "~/lib/types";

/**
 * Two variants of the same event card live in the mock:
 *  - `wide` on Home: artwork, date chip, title, venue and time, chevron.
 *  - `featured` on Events: taller artwork, tags and a "Get Tickets" call to
 *    action with the "from GHC…" price.
 */
export function FeaturedEventCard({
  event,
  variant = "featured",
  onSelect,
}: {
  event: EventItem;
  variant?: "wide" | "featured";
  onSelect: () => void;
}) {
  const badge = dateBadge(event.date);
  const featured = variant === "featured";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative isolate block w-full overflow-hidden rounded-[5px] bg-media text-left shadow-card",
        "transition active:scale-[0.995]",
        featured ? "h-[228px]" : "h-[136px]",
      )}
      aria-label={`${event.title} — ${event.venue}, ${badge.weekday} ${badge.day} ${badge.month}`}
    >
      <img
        src={mediaUrl(event.image.src)}
        alt={event.image.alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        draggable={false}
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-black/25" />

      <span
        className={cn(
          "relative flex h-full flex-col justify-between",
          featured ? "p-3" : "p-3",
        )}
      >
        <DateBadge {...badge} />

        <span className="block">
          <span className="flex items-end justify-between gap-2">
            <span
              className={cn(
                "block font-bold leading-tight tracking-[-0.02em] text-white",
                featured ? "text-[18px]" : "text-[16px]",
              )}
            >
              {event.title}
            </span>
            {featured ? null : (
              <Icon name="chevron-right" size={17} className="mb-1 shrink-0 text-white/80" />
            )}
          </span>

          <span className="mt-[3px] flex items-center gap-1 text-[12px] leading-snug text-white/85">
            <Icon name="map-pin" size={12} className="shrink-0 text-white/70" />
            <span className="truncate">
              {event.venue}, {event.city}
            </span>
            {featured ? (
              <>
                <span className="mx-0.5 h-[3px] w-[3px] shrink-0 rounded-full bg-white/60" />
                <span className="shrink-0 text-white/80">{distance(event.distanceKm)}</span>
              </>
            ) : null}
          </span>

          {featured ? (
            <>
              <span className="mt-1.5 flex flex-wrap gap-1.5">
                {event.tags.slice(0, 3).map((tag) => (
                  <Tag key={tag} tone="onMedia">
                    {tag}
                  </Tag>
                ))}
              </span>
              {/* Price and call to action sit on the artwork itself — the mock
                  keeps the featured card one continuous dark panel. */}
              <span className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[12px] font-medium leading-none text-brand">
                  from <span className="text-[14px] font-bold">{cedis(event.priceFrom)}</span>
                </span>
                <span className="inline-flex h-[34px] items-center rounded-[4px] bg-brand px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_-10px_rgb(252_83_3/0.9)]">
                  Get Tickets
                </span>
              </span>
            </>
          ) : (
            <span className="mt-1 flex items-center gap-1 text-[11.5px] leading-snug text-white/80">
              <Icon name="clock" size={12} className="shrink-0 text-white/70" />
              {timeRange(event.startTime, event.endTime)}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
