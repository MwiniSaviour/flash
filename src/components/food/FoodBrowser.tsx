"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Icon } from "@/components/flash/Icon";
import { RestaurantCard, RestaurantListCard } from "@/components/food/RestaurantCards";
import { EmptyState, ScreenHeader, SectionHeading } from "@/components/flash/ui";
import { useCart } from "@/lib/cart";
import type { Restaurant } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

const CUISINES = ["All", "Ghanaian", "Street Food", "Grill", "Seafood", "Continental", "Pizza", "Burgers", "Breakfast"] as const;
type CuisineFilter = (typeof CUISINES)[number];

/**
 * Food: the kitchens that can deliver to you now.
 *
 * Two questions decide this screen — what is close, and what is worth the
 * money — so it answers both in order: the kitchens nearest you, then the ones
 * Flash is moving most. Search and the cuisine chips narrow both rails, and
 * "View all" turns a rail into the full list it stands for.
 */
export function FoodBrowser({
  restaurants,
  city,
}: {
  restaurants: Restaurant[];
  city?: string | null;
}) {
  const cart = useCart();
  const [active, setActive] = useState<CuisineFilter>("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<"near" | "popular" | null>(null);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const inFilter = active === "All" || restaurant.cuisine === active;
      const inQuery =
        term.length === 0 ||
        [restaurant.name, restaurant.tagline, restaurant.cuisine, restaurant.neighbourhood]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return inFilter && inQuery;
    });
  }, [active, query, restaurants]);

  const byDistance = useMemo(
    () => [...visible].sort((a, b) => a.distanceKm - b.distanceKm),
    [visible],
  );

  const byPopularity = useMemo(
    () =>
      [...visible].sort(
        (a, b) => b.ratingCount * b.rating - a.ratingCount * a.rating,
      ),
    [visible],
  );

  const filtering = active !== "All" || query.trim().length > 0;

  function toggle(section: "near" | "popular") {
    setExpanded((current) => (current === section ? null : section));
  }

  return (
    <div className="pb-5">
      <ScreenHeader
        title="Food"
        subtitle={city ? `Kitchens delivering in ${city} tonight.` : "Kitchens that deliver to your door tonight."}
        className="pt-2"
      />

      <div className="mt-3.5 px-5">
        <div className="flex h-[46px] items-center gap-2 rounded-[12px] border border-line bg-surface px-3 focus-within:border-brand/50">
          <Icon name="search" size={17} className="shrink-0 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search kitchens, dishes or areas"
            aria-label="Search kitchens, dishes or areas"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-muted focus:outline-none"
          />
          {cart.count > 0 ? (
            <Link
              href="/food/checkout"
              aria-label={`Your bag — ${cart.count} ${cart.count === 1 ? "item" : "items"}`}
              className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-1 text-[11.5px] font-bold text-brand-ink transition-colors hover:bg-brand/15"
            >
              <Icon name="bag" size={13} />
              {cart.count}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="rail no-scrollbar mt-3 gap-1.5 px-5 pb-0.5 lg:flex-wrap lg:overflow-visible">
        {CUISINES.map((cuisine) => {
          const isActive = cuisine === active;

          return (
            <button
              key={cuisine}
              type="button"
              onClick={() => setActive(cuisine)}
              aria-pressed={isActive}
              className={cn(
                "h-[32px] shrink-0 snap-start rounded-[9px] px-3 text-[12px] font-semibold transition active:scale-95",
                isActive
                  ? "bg-brand-solid text-white shadow-brand"
                  : "border border-line bg-surface text-icon-idle",
              )}
            >
              {cuisine}
            </button>
          );
        })}
      </div>

      {filtering ? (
        <section className="mt-6">
          <SectionHeading
            title={visible.length === 1 ? "1 kitchen" : `${visible.length} kitchens`}
            className="px-5"
          />

          {visible.length ? (
            <ul className="mt-3 space-y-2.5 px-5">
              {visible.map((restaurant) => (
                <li key={restaurant.id}>
                  <RestaurantListCard restaurant={restaurant} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 px-5">
              <EmptyState message="No kitchens match that search yet." />
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="mt-6">
            <SectionHeading
              title="Kitchens near you"
              action={expanded === "near" ? "Show less" : "View all"}
              onAction={() => toggle("near")}
              className="px-5"
            />

            {expanded === "near" ? (
              <ul className="mt-3 space-y-2.5 px-5">
                {byDistance.map((restaurant) => (
                  <li key={restaurant.id}>
                    <RestaurantListCard restaurant={restaurant} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rail no-scrollbar mt-3 gap-3 px-5 pb-1">
                {byDistance.slice(0, 5).map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-7">
            <SectionHeading
              title="Popular kitchens"
              action={expanded === "popular" ? "Show less" : "View all"}
              onAction={() => toggle("popular")}
              className="px-5"
            />

            {expanded === "popular" ? (
              <ul className="mt-3 space-y-2.5 px-5">
                {byPopularity.map((restaurant) => (
                  <li key={restaurant.id}>
                    <RestaurantListCard restaurant={restaurant} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rail no-scrollbar mt-3 gap-3 px-5 pb-1">
                {byPopularity.slice(0, 5).map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
