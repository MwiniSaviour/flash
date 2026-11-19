"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Icon } from "@/components/flash/Icon";
import { StickyAction } from "@/components/flash/StickyAction";
import { Rating, SectionHeading, Tag } from "@/components/flash/ui";
import { Fact, KitchenBanner } from "@/components/food/KitchenBanner";
import { MenuItemCard } from "@/components/food/MenuItemCards";
import { useCart } from "@/lib/cart";
import { cedis, distance, minutes } from "@/lib/flash/format";
import {
  activeDiscountPercent,
  deliveryQuote,
  discountLabel,
  priceAfterDiscount,
} from "@/lib/flash/pricing";
import type { Restaurant } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

/**
 * A kitchen: its picture, its rating and everything it cooks.
 *
 * The menu is the point of the screen, so the dishes lead — first the ones the
 * kitchen is known for, then the rest behind "View all". The bag follows along
 * in the sticky bar, because ordering is the thing the customer came here to
 * do.
 */
export function RestaurantDetail({ restaurant }: { restaurant: Restaurant }) {
  const cart = useCart();
  const [added, setAdded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const cartForThisKitchen = cart.lines.filter(
    (line) => line.restaurant.id === restaurant.id,
  );
  const cartTotal = cartForThisKitchen.reduce(
    (total, line) => total + line.price * line.quantity,
    0,
  );
  const cartCount = cartForThisKitchen.reduce(
    (total, line) => total + line.quantity,
    0,
  );

  const menu = useMemo(() => {
    const term = query.trim().toLowerCase();

    return restaurant.menu.filter((item) =>
      term.length === 0
        ? true
        : [item.name, item.description].join(" ").toLowerCase().includes(term),
    );
  }, [query, restaurant.menu]);

  /**
   * What the rail shows: the dishes the kitchen is known for first, then
   * enough of the rest to fill the row. A rail with one card is an empty rail.
   */
  const recommended = useMemo(() => {
    const popular = menu.filter((item) => item.popular);
    const rest = menu.filter((item) => !item.popular);
    return [...popular, ...rest].slice(0, 6);
  }, [menu]);

  function add(itemId: string) {
    const item = restaurant.menu.find((entry) => entry.id === itemId);
    if (!item) return;

    cart.add(item, {
      id: restaurant.id,
      name: restaurant.name,
      deliveryFee: restaurant.deliveryFee,
      distanceKm: restaurant.distanceKm,
      etaMinutes: restaurant.etaMinutes,
      neighbourhood: restaurant.neighbourhood,
    });
    setAdded(itemId);
    setTimeout(() => setAdded(null), 1200);
  }

  return (
    <div className="pb-28">
      <KitchenBanner
        image={restaurant.image}
        title={restaurant.name}
        subtitle={restaurant.tagline}
        badge={restaurant.badge}
        backHref="/food"
        backLabel="Back to food"
        facts={[
          <Rating key="rating" value={restaurant.rating} count={restaurant.ratingCount} />,
          <span key="eta" className="flex items-center gap-1.5">
            <Fact icon="timer" />
            {minutes(restaurant.etaMinutes)}
          </span>,
          <span key="place" className="flex items-center gap-1.5">
            <Fact icon="map-pin" />
            {restaurant.neighbourhood} · {distance(restaurant.distanceKm)}
          </span>,
        ]}
      />

      <div className="px-5 pt-4">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-soft">
          <span className="flex items-center gap-1.5 font-semibold text-ink">
            <Icon name="bag" size={15} className="shrink-0 text-brand" />
            Delivery {cedis(deliveryQuote(restaurant))}
          </span>
          <span className="h-[3px] w-[3px] rounded-full bg-muted-soft" />
          <span className="text-muted">Free when you collect it</span>
        </p>

        <div className="mt-4 flex h-[44px] items-center gap-2 rounded-[12px] border border-line bg-surface px-3 focus-within:border-brand/50">
          <Icon name="search" size={16} className="shrink-0 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this menu"
            aria-label="Search this menu"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-muted focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear the menu search"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition active:scale-95"
            >
              <Icon name="close" size={13} />
            </button>
          ) : null}
        </div>
      </div>

      <section className="mt-6">
        <SectionHeading
          title={query ? `${menu.length} dishes` : "Recommended"}
          action={showAll ? "Show less" : "View all"}
          onAction={() => setShowAll((current) => !current)}
          className="px-5"
        />

        {menu.length === 0 ? (
          <p className="mt-3 px-5 text-[13px] text-muted">
            Nothing on this menu matches “{query.trim()}”.
          </p>
        ) : showAll ? (
          <ul className="mt-3 divide-y divide-line/70 px-5">
            {menu.map((item) => {
              const inCart = cartForThisKitchen.find((line) => line.menuItemId === item.id);
              const percent = activeDiscountPercent(item);

              return (
                <li key={item.id} className="flex items-start gap-3 py-3.5">
                  <span className="relative block h-[68px] w-[68px] shrink-0 overflow-hidden rounded-[12px] bg-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image.src}
                      alt={item.image.alt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      draggable={false}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[14.5px] font-semibold leading-tight text-ink">
                        {item.name}
                      </span>
                      {item.popular ? (
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-brand-ink">
                          Popular
                        </span>
                      ) : null}
                      {item.vegetarian ? <Tag>Veg</Tag> : null}
                      {percent > 0 ? (
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-brand-ink">
                          {discountLabel(percent)}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-[12.5px] leading-snug text-muted">
                      {item.description}
                    </span>
                    <span className="mt-1.5 flex items-center gap-2">
                      <span className="text-[13px] font-bold tracking-[-0.01em] text-ink">
                        {cedis(percent > 0 ? priceAfterDiscount(item.price, item) : item.price)}
                      </span>
                      {percent > 0 ? (
                        <span className="text-[11.5px] text-muted line-through">
                          {cedis(item.price)}
                        </span>
                      ) : null}
                      {inCart ? (
                        <span className="text-[11.5px] font-semibold text-brand-ink">
                          {inCart.quantity} in bag
                        </span>
                      ) : null}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => add(item.id)}
                    aria-label={`Add ${item.name} to your cart`}
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-full transition active:scale-95",
                      added === item.id
                        ? "bg-brand-solid text-white"
                        : "border border-line bg-surface text-ink hover:border-line-strong",
                    )}
                  >
                    <Icon name={added === item.id ? "check" : "plus"} size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rail no-scrollbar mt-3 gap-3 px-5 pb-1">
            {recommended.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                href={`/food/${restaurant.slug}/dish/${item.id}`}
                added={added === item.id}
                onAdd={() => add(item.id)}
              />
            ))}
          </div>
        )}
      </section>
      {cartForThisKitchen.length > 0 ? (
        <StickyAction>
          <div className="min-w-0">
            <p className="text-[11.5px] text-muted">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </p>
            <p className="text-[17px] font-bold tracking-[-0.02em] text-ink">{cedis(cartTotal)}</p>
          </div>
          <Link
            href="/food/checkout"
            className="ml-auto inline-flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover lg:max-w-[320px]"
          >
            View cart
            <Icon name="arrow-right" size={16} />
          </Link>
        </StickyAction>
      ) : null}
    </div>
  );
}
