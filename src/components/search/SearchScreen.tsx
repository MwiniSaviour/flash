"use client";

import { useMemo, useState } from "react";

import { EventListCard } from "@/components/events/EventCards";
import { Icon } from "@/components/flash/Icon";
import { RestaurantListCard } from "@/components/food/RestaurantCards";
import { EmptyState, ScreenHeader, SectionHeading } from "@/components/flash/ui";
import type { Event, Restaurant } from "@/lib/flash/types";

/**
 * Search across the three services at once.
 *
 * One field, one result list: an event, a kitchen or a ride class is the same
 * kind of thing to the person typing — something to do tonight.
 */
export function SearchScreen({
  events,
  restaurants,
  initialQuery = "",
}: {
  events: Event[];
  restaurants: Restaurant[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);

  const { matchedEvents, matchedRestaurants } = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (term.length === 0) {
      return { matchedEvents: [], matchedRestaurants: [] };
    }

    const matches = (values: string[]) => values.join(" ").toLowerCase().includes(term);

    return {
      matchedEvents: events.filter((event) =>
        matches([event.title, event.venue, event.neighbourhood, ...event.categories]),
      ),
      matchedRestaurants: restaurants.filter((restaurant) =>
        matches([
          restaurant.name,
          restaurant.tagline,
          restaurant.cuisine,
          restaurant.neighbourhood,
          ...restaurant.menu.map((item) => item.name),
        ]),
      ),
    };
  }, [events, query, restaurants]);

  const empty = query.trim().length === 0;

  return (
    <div className="pb-5">
      <ScreenHeader title="Search" subtitle="Events, kitchens and rides in one place." className="pt-2" />

      <div className="mt-3.5 px-5">
        <label className="flex h-[46px] items-center gap-2 rounded-[12px] border border-line bg-surface px-3 focus-within:border-brand/50">
          <Icon name="search" size={17} className="shrink-0 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “jollof”, “Labadi” or “comedy”"
            aria-label="Search events, kitchens and rides"
            className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-muted focus:outline-none"
          />
        </label>
      </div>

      {empty ? (
        <>
          <section className="mt-6">
            <SectionHeading title="Happening now" actionHref="/events" action="All events" />
            <ul className="mt-3 space-y-2.5 px-5">
              {events.slice(0, 4).map((event) => (
                <li key={event.id}>
                  <EventListCard event={event} />
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <SectionHeading title="Kitchens delivering now" actionHref="/food" action="Order food" />
            <ul className="mt-3 space-y-2.5 px-5">
              {restaurants.slice(0, 3).map((restaurant) => (
                <li key={restaurant.id}>
                  <RestaurantListCard restaurant={restaurant} />
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {matchedEvents.length > 0 ? (
        <section className="mt-6">
          <SectionHeading title="Events" />
          <ul className="mt-3 space-y-2.5 px-5">
            {matchedEvents.map((event) => (
              <li key={event.id}>
                <EventListCard event={event} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {matchedRestaurants.length > 0 ? (
        <section className="mt-6">
          <SectionHeading title="Kitchens" />
          <ul className="mt-3 space-y-2.5 px-5">
            {matchedRestaurants.map((restaurant) => (
              <li key={restaurant.id}>
                <RestaurantListCard restaurant={restaurant} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!empty && matchedEvents.length === 0 && matchedRestaurants.length === 0 ? (
        <div className="mt-6 px-5">
          <EmptyState message={`Nothing matches “${query}” yet.`} />
        </div>
      ) : null}
    </div>
  );
}
