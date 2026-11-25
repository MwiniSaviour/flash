import { BrandHeader } from "@/components/flash/BrandHeader";
import { SectionHeading } from "@/components/flash/ui";
import { EventMiniCard } from "@/components/events/EventCards";
import { FeaturedEventCard } from "@/components/events/FeaturedEventCard";
import { RestaurantRailCard } from "@/components/food/RestaurantCards";
import { HeroCarousel, type HeroSlide } from "@/components/home/HeroCarousel";
import { UpNextTile } from "@/components/home/UpNextTile";
import { RideBriefCard } from "@/components/ride/RideBriefCard";
import { clock, relativeDay } from "@/lib/flash/format";
import { filterByCity } from "@/lib/flash/location";
import { currentCity } from "@/lib/flash/location-server";
import type { ImageAsset } from "@/lib/flash/types";
import {
  getCurrentUser,
  getRideQuote,
  getTrendingEvents,
  getTrendingRestaurants,
  getUpcomingEvents,
  listRestaurants,
} from "@/lib/flash/repository";

/**
 * Home — the blend.
 *
 * The reference app opens on a live broadcast, then what is on next, then the
 * next event and then what is trending. Flash keeps that composition and
 * fills it with the three services it sells: a slideshow of what is trending
 * tonight, the next thing in each service, the next events, what is trending
 * to eat and a ride brief.
 */
export default async function HomePage() {
  const city = await currentCity();
  const [user, trendingEvents, restaurants, quote, upcoming] = await Promise.all([
    getCurrentUser(),
    getTrendingEvents(3),
    listRestaurants(),
    getRideQuote(),
    getUpcomingEvents(),
  ]);

  const inCity = <T,>(items: T[], placeOf: (item: T) => string | null) =>
    filterByCity(items, city, placeOf);
  const cityEvents = inCity(upcoming, (event) => event.city ?? event.neighbourhood);
  const cityTrendingEvents = inCity(trendingEvents, (event) => event.city ?? event.neighbourhood);
  const cityRestaurants = inCity(restaurants, (restaurant) => restaurant.neighbourhood);
  const cityTrendingFood = inCity(await getTrendingRestaurants(2), (restaurant) => restaurant.neighbourhood);
  const featured = cityEvents.find((event) => event.featured) ?? cityEvents[0];
  const moreEvents = cityEvents.filter((event) => event.id !== featured?.id).slice(0, 4);

  // Five slides: three trending shows and two trending kitchens.
  const slides: HeroSlide[] = [
    ...cityTrendingEvents.slice(0, 3).map((event) => ({
      id: event.id,
      kind: "event" as const,
      badge: "Trending event",
      title: event.title,
      meta: `${event.neighbourhood} · ${relativeDay(event.date)}, ${clock(event.startTime)}`,
      price: `from GHC${event.priceFrom}`,
      image: event.image,
      href: `/events/${event.slug}`,
    })),
    ...cityTrendingFood.map((restaurant) => ({
      id: restaurant.id,
      kind: "food" as const,
      badge: "Trending food",
      title: restaurant.name,
      meta: `${restaurant.neighbourhood} · ${restaurant.etaMinutes} min delivery`,
      price: `delivery GHC${restaurant.deliveryFee}`,
      image: restaurant.image,
      href: `/food/${restaurant.slug}`,
    })),
  ];

  const nextShow = cityEvents[0];
  const topKitchen = cityRestaurants[0];

  const nextTiles: {
    href?: string;
    artwork: ImageAsset;
    title: string;
    meta: string;
    sub: string;
    booking?: { kind: "ride"; dropoff?: string };
  }[] = [
    {
      href: nextShow ? `/events/${nextShow.slug}` : "/events",
      artwork: nextShow?.image ?? {
        src: "/assets/images/event-sunset-live.jpg",
        alt: "A crowd with hands raised in front of a lit stage at sunset",
      },
      title: nextShow?.title ?? "Nothing on yet",
      meta: nextShow ? `${relativeDay(nextShow.date)} · ${clock(nextShow.startTime)}` : "Browse events",
      sub: nextShow ? `${nextShow.venue}, ${nextShow.neighbourhood}` : "Find something on",
    },
    {
      href: undefined,
      artwork: {
        src: "/assets/images/ride-bike-sunset.jpg",
        alt: "A motorcyclist riding at sunset on an open road",
      },
      title: "Taxi to Labadi",
      meta: "12 min away",
      sub: "Oxford Street → Labadi",
      booking: { kind: "ride" as const, dropoff: "Labadi Beach, Accra" },
    },
    {
      href: topKitchen ? `/food/${topKitchen.slug}` : "/food",
      artwork: topKitchen?.image ?? {
        src: "/assets/images/dish-fried-rice.jpg",
        alt: "Fried rice with chicken, sweetcorn and spring onion on a square plate",
      },
      title: topKitchen?.name ?? "Nothing nearby",
      meta: topKitchen ? `${topKitchen.etaMinutes} min delivery` : "Browse food",
      sub: topKitchen ? `${topKitchen.cuisine} · ${topKitchen.neighbourhood}` : "Find a kitchen",
    },
    {
      href: "/bookings",
      artwork: {
        src: "/assets/images/event-concert-crowd.jpg",
        alt: "A festival crowd with raised arms lit by orange stage lights",
      },
      title: "Your tickets",
      meta: "4 upcoming",
      sub: "Next: Sunset Live Sessions",
    },
  ];

  return (
    <div className="pb-5">
      <h1 className="sr-only">Flash — tickets, rides and food in Accra</h1>

      <BrandHeader user={user} />

      <HeroCarousel slides={slides} />

      <section className="mt-5">
        <SectionHeading title="Up Next" action="See all" actionHref="/search" className="px-5" />
        <div className="rail-grid no-scrollbar mt-3 gap-3 px-5">
          {nextTiles.map((tile) => (
            <UpNextTile key={tile.title} {...tile} />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <SectionHeading title="Upcoming Events" action="See all" actionHref="/events" className="px-5" />
        <div className="mt-3 px-5">
          {featured ? <FeaturedEventCard event={featured} variant="wide" priority /> : null}
        </div>
        <div className="rail-grid no-scrollbar mt-4 gap-3 px-5">
          {moreEvents.map((event) => (
            <EventMiniCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <SectionHeading title="Trending Now" action="Order food" actionHref="/food" className="px-5" />
        <div className="rail-grid no-scrollbar mt-3 gap-3 px-5">
          {cityRestaurants.slice(0, 4).map((restaurant) => (
            <RestaurantRailCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <RideBriefCard quote={quote} />
      </section>
    </div>
  );
}
