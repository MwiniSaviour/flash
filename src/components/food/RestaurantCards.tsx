import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { Rating } from "@/components/flash/ui";
import { cedis, distance, minutes } from "@/lib/flash/format";
import { deliveryQuote } from "@/lib/flash/pricing";
import type { Restaurant } from "@/lib/flash/types";
import { deliverySrcSet, deliveryUrl } from "@/lib/media/url";

/**
 * The browse card.
 *
 * The photograph carries the appetite, the rating sits on the photograph where
 * the eye lands first, and the two numbers that decide the order — what it
 * costs to get there and how long it takes — sit under the name in the accent
 * colour, because those are the numbers the customer is actually choosing on.
 */
export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      href={`/food/${restaurant.slug}`}
      className="block w-[224px] shrink-0 snap-start transition active:scale-[0.97]"
    >
      <span className="relative block aspect-square w-full overflow-hidden rounded-[16px] bg-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={deliveryUrl(restaurant.image.src, 800)}
          srcSet={deliverySrcSet(restaurant.image.src)}
          alt={restaurant.image.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />

        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 shadow-[0_2px_8px_rgb(20_18_15/0.18)]">
          <Rating value={restaurant.rating} count={restaurant.ratingCount} />
        </span>

        {restaurant.badge ? (
          <span className="absolute right-2 top-2 whitespace-nowrap rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-brand-ink shadow-[0_2px_8px_rgb(20_18_15/0.18)]">
            {restaurant.badge}
          </span>
        ) : null}
      </span>

      <span className="mt-2.5 block truncate text-[15px] font-bold leading-tight tracking-[-0.015em] text-ink">
        {restaurant.name}
      </span>
      <span className="mt-1 block truncate text-[12.5px] text-muted">
        {restaurant.cuisine} · {restaurant.neighbourhood}
      </span>

      <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
        <span className="flex items-center gap-1 font-semibold text-brand-ink">
          <Icon name="bag" size={13} className="shrink-0" />
          {cedis(deliveryQuote(restaurant))} delivery
        </span>
        <span className="flex items-center gap-1 text-muted">
          <Icon name="timer" size={13} className="shrink-0 text-muted-soft" />
          {minutes(restaurant.etaMinutes)}
        </span>
      </span>
    </Link>
  );
}

/** The rail card: artwork, the kitchen, how long it takes and how it is rated. */
export function RestaurantRailCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      href={`/food/${restaurant.slug}`}
      className="block w-[168px] shrink-0 snap-start lg:w-auto lg:shrink transition active:scale-[0.97]"
    >
      <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-[14px] bg-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={deliveryUrl(restaurant.image.src, 800)}
          srcSet={deliverySrcSet(restaurant.image.src)}
          alt={restaurant.image.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
        {restaurant.badge ? (
          <span className="absolute left-2 top-2 whitespace-nowrap rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-brand-ink backdrop-blur-sm">
            {restaurant.badge}
          </span>
        ) : null}
      </span>

      <span className="mt-2 block truncate text-[13.5px] font-semibold leading-tight tracking-[-0.01em] text-ink">
        {restaurant.name}
      </span>
      <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted">
        <Rating value={restaurant.rating} />
        <span className="h-[3px] w-[3px] rounded-full bg-muted-soft" />
        <span>{restaurant.etaMinutes} min</span>
      </span>
    </Link>
  );
}

/** The browse row: artwork, the kitchen's own words, and what it costs to get there. */
export function RestaurantListCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      href={`/food/${restaurant.slug}`}
      className="flex w-full items-start gap-3 rounded-[14px] border border-line/90 bg-surface p-2.5 transition hover:border-line-strong active:scale-[0.99]"
    >
      <span className="relative block h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[12px] bg-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={deliveryUrl(restaurant.image.src, 800)}
          srcSet={deliverySrcSet(restaurant.image.src)}
          alt={restaurant.image.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </span>

      <span className="min-w-0 flex-1 py-0.5">
        <span className="block truncate text-[15.5px] font-semibold leading-tight tracking-[-0.015em] text-ink">
          {restaurant.name}
        </span>
        <span className="mt-1 block truncate text-[12.5px] text-muted">{restaurant.tagline}</span>

        <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
          <Rating value={restaurant.rating} count={restaurant.ratingCount} />
          <span className="h-[3px] w-[3px] rounded-full bg-muted-soft" />
          <span>{restaurant.cuisine}</span>
          <span className="h-[3px] w-[3px] rounded-full bg-muted-soft" />
          <span>{restaurant.etaMinutes} min</span>
        </span>

        {/* The badge sits under the name, never beside it: a long badge beside
            the name is what collapses the name to one character at 390px. */}
        <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {restaurant.badge ? (
            <span className="shrink-0 rounded-full bg-brand-soft px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-brand-ink">
              {restaurant.badge}
            </span>
          ) : null}
          <span className="flex items-center gap-1 text-[12px] text-muted">
            <Icon name="bag" size={13} className="text-muted-soft" />
            {cedis(restaurant.deliveryFee)} delivery · {distance(restaurant.distanceKm)}
          </span>
        </span>
      </span>

      <Icon name="chevron-right" size={17} className="mt-8 shrink-0 text-muted-soft" />
    </Link>
  );
}


