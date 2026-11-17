import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Icon } from "~/components/ui/Icon";
import { ScreenHeader, SectionHeading } from "~/components/ui/primitives";
import { EventListCard } from "~/components/events/EventListCard";
import { FeaturedEventCard } from "~/components/events/FeaturedEventCard";
import { useContent } from "~/content/ContentProvider";
import { cn } from "~/lib/cn";

const FILTERS = ["All", "Music", "Comedy", "Food & Drink", "Community"] as const;
type Filter = (typeof FILTERS)[number];

/**
 * Events: search, category chips, one featured event and the upcoming list.
 *
 * Chips filter by event tag (the CMS stores the same tag strings), and the
 * search field matches event, venue and city so it behaves like the site's
 * search rather than a decorative input.
 */
export function ExploreScreen() {
  const navigate = useNavigate();
  const { events } = useContent();
  const [active, setActive] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return events.filter((event) => {
      const inFilter = active === "All" || event.tags.includes(active as never);
      const inQuery =
        term.length === 0 ||
        [event.title, event.venue, event.city, ...event.tags]
          .join(" ")
          .toLowerCase()
          .includes(term);
      return inFilter && inQuery;
    });
  }, [active, events, query]);

  const featured = visible.find((event) => event.featured) ?? visible[0];
  const nearby = visible
    .filter((event) => event.id !== featured?.id)
    .slice()
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <div className="pb-4">
      <ScreenHeader
        title="Events"
        subtitle="Events, shows, and experiences near you."
        className="pt-0.5"
      />

      <div className="mt-3.5 flex items-center gap-2 px-5">
        <label className="flex h-[44px] flex-1 items-center gap-2 rounded-[4px] border border-line bg-surface/85 px-3 focus-within:border-brand/40">
          <Icon name="search" size={17} className="shrink-0 text-[#3c4657]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events, venues or artists..."
            aria-label="Search events, venues or artists"
            className="w-full bg-transparent text-[12.5px] text-ink placeholder:text-muted-soft focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => setFilterOpen((open) => !open)}
          aria-label="Filter events"
          aria-expanded={filterOpen}
          className={cn(
            "grid h-[44px] w-[44px] shrink-0 place-items-center rounded-[4px] border transition active:scale-95",
            filterOpen
              ? "border-brand/30 bg-brand-soft text-brand"
              : "border-line bg-surface/80 text-[#1d2532]",
          )}
        >
          <Icon name="filter" size={19} />
        </button>
      </div>

      {filterOpen ? (
        <p className="animate-fade mx-5 mt-2 rounded-xl bg-surface-2/70 px-3 py-2 text-[12px] leading-snug text-muted">
          Showing {visible.length} of {events.length} events. Pick a tag below to narrow the list.
        </p>
      ) : null}

      <div className="rail no-scrollbar mt-3 gap-1.5 px-5 pb-0.5">
        {FILTERS.map((filter) => {
          const isActive = filter === active;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActive(filter)}
              aria-pressed={isActive}
              className={cn(
                "h-[30px] shrink-0 snap-start rounded-[4px] px-3 text-[11.5px] font-medium transition active:scale-95",
                isActive
                  ? "bg-brand text-white shadow-[0_6px_14px_-6px_rgb(252_83_3/0.7)]"
                  : "border border-line bg-surface/70 text-[#3c4657]",
              )}
            >
              {filter}
            </button>
          );
        })}
      </div>

      <section className="mt-4">
        <SectionHeading
          title="Featured Events"
          action="See All"
          onAction={() => navigate("/tickets")}
          className="px-5"
        />
        <div className="mt-2.5 px-5">
          {featured ? (
            <FeaturedEventCard
              event={featured}
              onSelect={() => navigate(`/events/${featured.slug}`)}
            />
          ) : (
            <EmptyState message="No events match that search yet." />
          )}
        </div>
      </section>

      <section className="mt-5">
        <SectionHeading title="Upcoming Events" className="px-5" />
        <ul className="mt-2.5 space-y-2 px-5">
          {nearby.map((event) => (
            <li key={event.id}>
              <EventListCard event={event} onSelect={() => navigate(`/events/${event.slug}`)} />
            </li>
          ))}
          {nearby.length === 0 && featured ? (
            <li>
              <EmptyState message="That's the only event in this category." />
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[5px] border border-dashed border-line-strong/70 bg-surface/50 px-4 py-8 text-center">
      <p className="text-[13px] leading-relaxed text-muted">{message}</p>
    </div>
  );
}
