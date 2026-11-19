import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { SectionHeading } from "@/components/flash/ui";
import { cedis, clock, distance, relativeDay } from "@/lib/flash/format";
import {
  getActiveOrder,
  getTrendingEvents,
  getTrendingRestaurants,
} from "@/lib/flash/repository";

/**
 * The desktop right rail.
 *
 * The social-app idiom's third column: what is happening now, what is on its
 * way to you and what is trending near you. It answers "is anything going on?"
 * without the reader leaving the page they are on.
 */
export async function RightRail() {
  const [events, restaurants, order] = await Promise.all([
    getTrendingEvents(2),
    getTrendingRestaurants(3),
    getActiveOrder(),
  ]);

  return (
    <aside className="no-print hidden w-[320px] shrink-0 flex-col gap-6 pb-10 lg:flex">
      <section>
        <SectionHeading title="Happening soon" actionHref="/events" action="All events" />
        <ul className="mt-3 space-y-2.5">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.slug}`}
                className="flex items-start gap-3 rounded-[14px] border border-line/80 bg-surface p-2 transition hover:border-line-strong"
              >
                <span className="relative block h-[62px] w-[62px] shrink-0 overflow-hidden rounded-[10px] bg-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.image.src}
                    alt={event.image.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold leading-tight text-ink">
                    {event.title}
                  </span>
                  <span className="mt-1 block text-[12px] text-muted">
                    {relativeDay(event.date)} · {clock(event.startTime)}
                  </span>
                  <span className="mt-1 block text-[12px] font-semibold text-brand-ink">
                    from {cedis(event.priceFrom)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {order ? (
        <section>
          <SectionHeading title="On its way to you" />
          <Link
            href="/bookings"
            className="mt-3 block rounded-[14px] border border-line/80 bg-surface p-3.5 transition hover:border-line-strong"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-ink">
                {order.status}
              </span>
            </div>
            <p className="mt-2 text-[14px] font-semibold text-ink">
              {order.rider.name} is riding to you
            </p>
            <p className="mt-1 text-[12.5px] text-muted">
              {order.lines.length} items · {order.address}
            </p>
            <p className="mt-2 text-[13px] font-bold text-ink">Arriving in {order.etaMinutes} min</p>
          </Link>
        </section>
      ) : null}

      <section>
        <SectionHeading title="Trending near you" actionHref="/food" action="Order food" />
        <ul className="mt-3 space-y-2.5">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <Link
                href={`/food/${restaurant.slug}`}
                className="flex items-center gap-3 rounded-[14px] border border-line/80 bg-surface p-2 transition hover:border-line-strong"
              >
                <span className="relative block h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[10px] bg-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={restaurant.image.src}
                    alt={restaurant.image.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">
                    {restaurant.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-muted">
                    {restaurant.cuisine} · {restaurant.etaMinutes} min
                  </span>
                </span>
                <span className="shrink-0 text-[12px] font-semibold text-muted">
                  {distance(restaurant.distanceKm)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-[12px] leading-relaxed text-muted">
        <Icon name="info" size={13} className="mr-1 inline-block align-[-2px]" />
        
      </p>
    </aside>
  );
}
