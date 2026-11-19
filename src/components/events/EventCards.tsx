import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { DateBadge, Tag } from "@/components/flash/ui";
import { dateBadge, distance , priceLabel } from "@/lib/flash/format";
import type { Event } from "@/lib/flash/types";
import { deliverySrcSet, deliveryUrl } from "@/lib/media/url";

/**
 * The upcoming-event row: artwork with the date chip on it, then the title,
 * where it is, what it is and what it costs.
 */
export function EventListCard({ event }: { event: Event }) {
  const badge = dateBadge(event.date);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="flex w-full items-start gap-3 rounded-[14px] border border-line/90 bg-surface p-2.5 transition hover:border-line-strong active:scale-[0.99]"
    >
      <span className="relative block h-[98px] w-[88px] shrink-0 overflow-hidden rounded-[10px] bg-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={deliveryUrl(event.image.src, 800)}
          srcSet={deliverySrcSet(event.image.src)}
          alt={event.image.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
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

        <span className="mt-2 flex flex-wrap gap-1.5">
          {event.categories.slice(0, 2).map((category) => (
            <Tag key={category}>{category}</Tag>
          ))}
        </span>

        <span className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[12px] font-medium leading-none text-brand-ink">
            from <span className="text-[14px] font-bold">{priceLabel(event.priceFrom)}</span>
          </span>
          <Icon name="chevron-right" size={17} className="shrink-0 text-muted-soft" />
        </span>
      </span>
    </Link>
  );
}

/**
 * The compact card used in horizontal rails: artwork, title and the one detail
 * that helps a decision.
 */
export function EventMiniCard({ event }: { event: Event }) {
  const badge = dateBadge(event.date);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="block w-[164px] shrink-0 snap-start lg:w-auto lg:shrink transition active:scale-[0.97]"
      aria-label={`${event.title}, ${badge.weekday} ${badge.day} ${badge.month}`}
    >
      <span className="relative block aspect-[4/5] w-full overflow-hidden rounded-[14px] bg-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={deliveryUrl(event.image.src, 800)}
          srcSet={deliverySrcSet(event.image.src)}
          alt={event.image.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <DateBadge {...badge} size="sm" tone="glass" className="absolute left-2 top-2" />
        <span className="absolute inset-x-2 bottom-2 block text-[12.5px] font-semibold leading-tight tracking-[-0.01em] text-white">
          {event.title}
        </span>
      </span>
      <span className="mt-1.5 block text-[11.5px] leading-snug text-muted">
        {event.venue} · {distance(event.distanceKm)}
      </span>
      <span className="mt-0.5 block text-[11.5px] font-semibold leading-snug text-brand-ink">
        from {priceLabel(event.priceFrom)}
      </span>
    </Link>
  );
}
