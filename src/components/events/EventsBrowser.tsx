"use client";

import { useMemo, useState } from "react";

import { EventListCard, EventMiniCard } from "@/components/events/EventCards";
import { FeaturedEventCard } from "@/components/events/FeaturedEventCard";
import { Icon } from "@/components/flash/Icon";
import { EmptyState, SectionHeading, ScreenHeader } from "@/components/flash/ui";
import type { Event } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Music", "Comedy", "Food & Drink", "Sports", "Wellness", "Party"] as const;
type Filter = (typeof FILTERS)[number];

/**
 * Events: search, category chips, one featured event and the upcoming list.
 *
 * Chips filter by the event's own categories, and the search field matches the
 * event, the venue and the neighbourhood — it behaves like the site's search
 * rather than as a decorative input.
 */
export function EventsBrowser({ events, city }: { events: Event[]; city?: string | null }) {
  const [active, setActive] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();

    return events.filter((event) => {
      const inFilter = active === "All" || event.categories.includes(active as never);
      const inQuery =
        term.length === 0 ||
        [event.title, event.venue, event.neighbourhood, ...event.categories]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return inFilter && inQuery;
    });
  }, [active, events, query]);

  const featured = visible.find((event) => event.featured) ?? visible[0];
  const nearby = visible
    .filter((event) => event.id !== featured?.id)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <div className="pb-5">
      <ScreenHeader
        title="Events"
        subtitle={city ? `Events, shows and experiences in ${city}.` : "Events, shows and experiences near you."}
        className="pt-2"
      />

      <div className="mt-3.5 flex items-center gap-2 px-5">
        <label className="flex h-[46px] flex-1 items-center gap-2 rounded-[12px] border border-line bg-surface px-3 focus-within:border-brand/50">
          <Icon name="search" size={17} className="shrink-0 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events, venues or artists"
            aria-label="Search events, venues or artists"
            className="w-full bg-transparent text-[13px] text-ink placeholder:text-muted focus:outline-none"
          />
        </label>

        <button
          type="button"
          onClick={() => setFilterOpen((open) => !open)}
          aria-label="Filter events"
          aria-expanded={filterOpen}
          className={cn(
            "grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[12px] border transition active:scale-95",
            filterOpen
              ? "border-brand/35 bg-brand-soft text-brand-ink"
              : "border-line bg-surface text-[#1d2532]",
          )}
        >
          <Icon name="filter" size={19} />
        </button>
      </div>

      {filterOpen ? (
        <p className="animate-fade mx-5 mt-2.5 rounded-[12px] bg-surface-2/70 px-3.5 py-2.5 text-[12.5px] leading-snug text-muted">
          Showing {visible.length} of {events.length} events. Pick a category to narrow the list.
        </p>
      ) : null}

      <div className="rail no-scrollbar mt-3 gap-1.5 px-5 pb-0.5 lg:flex-wrap lg:overflow-visible">
        {FILTERS.map((filter) => {
          const isActive = filter === active;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActive(filter)}
              aria-pressed={isActive}
              className={cn(
                "h-[32px] shrink-0 snap-start rounded-[9px] px-3 text-[12px] font-semibold transition active:scale-95",
                isActive
                  ? "bg-brand-solid text-white shadow-brand"
                  : "border border-line bg-surface text-icon-idle",
              )}
            >
              {filter}
            </button>
          );
        })}
      </div>

      <section className="mt-5">
        <SectionHeading
          title="Featured Events"
          action={showAll ? "Show less" : "See all"}
          onAction={() => setShowAll((value) => !value)}
          className="px-5"
        />

        {showAll ? (
          <ul className="mt-3 grid grid-cols-2 gap-2.5 px-5">
            {visible.map((event) => (
              <li key={event.id}>
                <EventMiniCard event={event} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 px-5">
            {featured ? (
              <FeaturedEventCard event={featured} priority />
            ) : (
              <EmptyState message="No events match that search yet." href="/events" action="Clear search" />
            )}
          </div>
        )}
      </section>

      <section className="mt-6">
        <SectionHeading title="Upcoming Events" className="px-5" />
        <ul className="mt-3 space-y-2.5 px-5">
          {nearby.map((event) => (
            <li key={event.id}>
              <EventListCard event={event} />
            </li>
          ))}
        </ul>

        {nearby.length === 0 && featured ? (
          <div className="px-5">
            <EmptyState message="That is the only event in this category." />
          </div>
        ) : null}
      </section>
    </div>
  );
}
