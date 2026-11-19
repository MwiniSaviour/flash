import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { DateBadge, Tag } from "@/components/flash/ui";
import { dateBadge, distance, timeRange , priceLabel } from "@/lib/flash/format";
import type { Event } from "@/lib/flash/types";

/**
 * The event card, in the two shapes the reference design uses:
 *
 *  - `wide` on Home: artwork, date chip, title, venue, time and a chevron.
 *  - `featured` on Events: taller artwork, tags, the "from GHC…" price and a
 *    "Get Tickets" call to action.
 *
 * Both stay one continuous dark panel — the price and the button sit on the
 * artwork rather than in a separate card under it.
 */
export function FeaturedEventCard({
  event,
  variant = "featured",
  priority = false,
}: {
  event: Event;
  variant?: "wide" | "featured";
  priority?: boolean;
}) {
  const badge = dateBadge(event.date);
  const featured = variant === "featured";

  return (
    <Link
      href={`/events/${event.slug}`}
      className={`relative isolate block w-full overflow-hidden rounded-[20px] bg-media text-left shadow-card transition active:scale-[0.995] ${
        featured ? "h-[244px]" : "h-[164px]"
      }`}
      aria-label={`${event.title} — ${event.venue}, ${badge.weekday} ${badge.day} ${badge.month}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={event.image.src}
        alt={event.image.alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading={priority ? "eager" : "lazy"}
        draggable={false}
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/94 via-black/55 to-black/30" />
      {/* A second, tighter wash under the type: a bright sky behind a white
          title is the one place this card can lose its edge. */}
      <span className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/75 to-transparent" />

      <span className="relative flex h-full flex-col justify-between p-3.5">
        <DateBadge {...badge} />

        <span className="block">
          <span className="flex items-end justify-between gap-2">
            <span
              className={`block font-bold leading-tight tracking-[-0.02em] text-white ${
                featured ? "text-[19px]" : "text-[17px]"
              }`}
            >
              {event.title}
            </span>
            {featured ? null : (
              <Icon name="chevron-right" size={18} className="mb-1 shrink-0 text-white/80" />
            )}
          </span>

          <span className="mt-[5px] flex items-center gap-1 text-[12.5px] leading-snug text-white/85">
            <Icon name="map-pin" size={12} className="shrink-0 text-white/70" />
            <span className="truncate">
              {event.venue}, {event.neighbourhood}
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
              <span className="mt-2 flex flex-wrap gap-1.5">
                {event.categories.slice(0, 3).map((category) => (
                  <Tag key={category} tone="onMedia">
                    {category}
                  </Tag>
                ))}
              </span>
              <span className="mt-2.5 flex items-center justify-between gap-3">
                <span className="text-[12px] font-medium leading-none text-brand">
                  from <span className="text-[15px] font-bold">{priceLabel(event.priceFrom)}</span>
                </span>
                <span className="inline-flex h-[38px] items-center rounded-[11px] bg-brand-solid px-4 text-[13.5px] font-bold text-white shadow-brand">
                  Get Tickets
                </span>
              </span>
            </>
          ) : (
            <span className="mt-1.5 flex items-center gap-1 text-[12px] leading-snug text-white/80">
              <Icon name="clock" size={12} className="shrink-0 text-white/70" />
              {timeRange(event.startTime, event.endTime)}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
