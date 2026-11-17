import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Icon } from "~/components/ui/Icon";
import { BackButton } from "~/components/layout/BackButton";
import { DateBadge, Tag } from "~/components/ui/primitives";
import { useContent } from "~/content/ContentProvider";
import { dateBadge, distance } from "~/lib/format";
import { mediaUrl } from "~/lib/api";

/**
 * Search across the seeded catalogue: events, stations and shows in one list,
 * each row deep-linking to the thing it describes.
 */
export function SearchScreen() {
  const navigate = useNavigate();
  const { events, stations } = useContent();
  const [query, setQuery] = useState("");

  const term = query.trim().toLowerCase();

  const eventHits = useMemo(
    () =>
      term
        ? events.filter((event) =>
            [event.title, event.venue, event.city, ...event.tags].join(" ").toLowerCase().includes(term),
          )
        : [],
    [events, term],
  );

  const stationHits = useMemo(
    () =>
      term
        ? stations.filter((station) =>
            [station.name, station.frequency, station.tagline, station.city]
              .join(" ")
              .toLowerCase()
              .includes(term),
          )
        : [],
    [stations, term],
  );

  const empty = term.length > 0 && eventHits.length === 0 && stationHits.length === 0;

  return (
    <div className="pb-6">
      <h1 className="sr-only">Search</h1>
      <header className="flex items-center gap-2 px-5 pt-2">
        <BackButton tone="dark" onClick={() => navigate(-1)} label="Close search" />
        <label className="flex h-[46px] flex-1 items-center gap-2.5 rounded-[4px] border border-line bg-surface/80 px-3.5 focus-within:border-brand/40">
          <Icon name="search" size={18} className="shrink-0 text-[#3c4657]" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events, stations, shows..."
            aria-label="Search"
            className="w-full bg-transparent text-[14px] text-ink placeholder:text-muted-soft focus:outline-none"
          />
        </label>
      </header>

      {term.length === 0 ? (
        <div className="px-5 pt-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-soft">
            Suggestions
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Sunset", "Comedy", "Afrobeats", "Highlife", "102.5"].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuery(suggestion)}
                className="rounded-full border border-line bg-surface/70 px-3 py-1.5 text-[12.5px] text-[#3c4657]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {stationHits.length ? (
        <section className="mt-5">
          <h2 className="px-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-soft">
            Stations
          </h2>
          <ul className="mt-2 space-y-2 px-3.5">
            {stationHits.map((station) => (
              <li key={station.id}>
                <button
                  type="button"
                  onClick={() => navigate("/live")}
                  className="flex w-full items-center gap-3 rounded-[5px] border border-line/90 bg-surface/70 p-2.5 text-left"
                >
                  <span className="block h-11 w-11 overflow-hidden rounded-[4px] bg-media">
                    <img
                      src={mediaUrl(station.artwork.src)}
                      alt={station.artwork.alt}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">
                      {station.name}
                    </span>
                    <span className="block text-[11.5px] text-muted">{station.frequency}</span>
                  </span>
                  <Icon name="chevron-right" size={16} className="text-muted-soft" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {eventHits.length ? (
        <section className="mt-5">
          <h2 className="px-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-soft">
            Events
          </h2>
          <ul className="mt-2 space-y-2 px-3.5">
            {eventHits.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/events/${event.slug}`)}
                  className="flex w-full items-center gap-3 rounded-[5px] border border-line/90 bg-surface/70 p-2.5 text-left"
                >
                  <span className="relative block h-[62px] w-[62px] shrink-0 overflow-hidden rounded-[4px] bg-media">
                    <img
                      src={mediaUrl(event.image.src)}
                      alt={event.image.alt}
                      className="h-full w-full object-cover"
                    />
                    <DateBadge {...dateBadge(event.date)} size="sm" className="absolute inset-x-1 top-1" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">
                      {event.title}
                    </span>
                    <span className="block truncate text-[11.5px] text-muted">
                      {event.venue} · {distance(event.distanceKm)}
                    </span>
                    <span className="mt-1 flex gap-1.5">
                      {event.tags.slice(0, 2).map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </span>
                  </span>
                  <Icon name="chevron-right" size={16} className="text-muted-soft" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {empty ? (
        <p className="mx-5 mt-8 rounded-2xl border border-dashed border-line-strong/70 px-4 py-8 text-center text-[13px] leading-relaxed text-muted">
          Nothing matches “{query}” yet. Try a venue, an artist or a station name.
        </p>
      ) : null}
    </div>
  );
}
