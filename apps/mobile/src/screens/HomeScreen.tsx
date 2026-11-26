import { useNavigate } from "react-router-dom";

import { Icon } from "~/components/ui/Icon";
import { PulseLogo } from "~/components/ui/PulseLogo";
import { SectionHeading } from "~/components/ui/primitives";
import { LiveHeroCard } from "~/components/radio/LiveHeroCard";
import { UpNextCard } from "~/components/radio/UpNextCard";
import { TrendingEventRow } from "~/components/events/TrendingEventRow";
import { FeaturedEventCard } from "~/components/events/FeaturedEventCard";
import { useContent } from "~/content/ContentProvider";
import { usePlayer } from "~/content/PlayerProvider";
import { mediaUrl } from "~/lib/api";
import { upcomingProgrammes } from "~/lib/schedule";
import { tileFor } from "~/lib/tiles";

import { shows as showFixtures } from "~/data/shows";

/**
 * Home: brand header, the flagship live player, the "Up Next" programme rail,
 * the next ticketed event and a "Trending Now" row — the order and spacing of the
 * design's second screen. Trending Now surfaces the most-booked upcoming event.
 */
export function HomeScreen() {
  const navigate = useNavigate();
  const { stations, events, listener, trendingEvent } = useContent();
  // Three programmes, no scroller: "See All" opens the full broadcast schedule.
  const upNext = upcomingProgrammes(showFixtures, new Date(), 3);
  const { play } = usePlayer();

  const flagship = stations.find((station) => station.flagship) ?? stations[0];
  // Featured first, then the soonest — the design's hero event is the featured one.
  const nextEvent = events.find((event) => event.featured) ?? events[0];

  return (
    <div className="pb-4">
      {/* The design has no visible page title; screen readers still need one h1. */}
      <h1 className="sr-only">ScalDive — Home</h1>
      <header className="flex items-center justify-between px-5 pt-3 pb-3.5">
        <PulseLogo />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/search")}
            aria-label="Search"
            className="grid h-8 w-8 place-items-center rounded-full text-[#1d2532] transition active:scale-95"
          >
            <Icon name="search" size={21} />
          </button>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            aria-label="Your profile"
            className="h-[34px] w-[34px] overflow-hidden rounded-full ring-[1.5px] ring-white/70 transition active:scale-95"
          >
            <img
              src={mediaUrl(listener.avatarUrl)}
              alt={`${listener.name}'s profile photo`}
              className="h-full w-full object-cover"
            />
          </button>
        </div>
      </header>

      <LiveHeroCard station={flagship} />

      <section className="mt-[18px]">
        {/* The parenthetical in the brief — "Up Next (Broadcast)" — reads as the
            desk label, so it becomes the eyebrow over the section heading. */}
        <p className="px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
          Broadcast
        </p>
        <SectionHeading
          title="Up Next"
          action="See All"
          onAction={() => navigate("/live")}
          className="px-5"
        />
        <div className="mt-2 grid grid-cols-3 gap-3 px-5">
          {upNext.map((programme, index) => (
            <UpNextCard
              key={programme.show.id}
              programme={programme}
              artwork={tileFor(index)}
              onSelect={() => {
                play(flagship);
                navigate("/live");
              }}
            />
          ))}
        </div>
      </section>

      <section className="mt-[18px]">
        <SectionHeading
          title="Upcoming Events"
          action="See All"
          onAction={() => navigate("/explore")}
          className="px-5"
        />
        <div className="mt-2.5 px-5">
          {nextEvent ? (
            <FeaturedEventCard
              event={nextEvent}
              variant="wide"
              onSelect={() => navigate(`/events/${nextEvent.slug}`)}
            />
          ) : null}
        </div>
      </section>

      <section className="mt-[18px]">
        <SectionHeading
          title="Trending Now"
          action="See All"
          onAction={() => navigate("/explore")}
          className="px-5"
        />
        <div className="mt-2.5 px-5">
          {trendingEvent ? (
            <TrendingEventRow
              event={trendingEvent.event}
              booked={trendingEvent.booked}
              onSelect={() => navigate(`/events/${trendingEvent.event.slug}`)}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
