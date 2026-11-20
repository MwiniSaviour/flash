"use client";

import Link from "next/link";

import { useState } from "react";

import { SignInGate } from "@/components/auth/SignInGate";
import { Icon } from "@/components/flash/Icon";
import { StickyAction } from "@/components/flash/StickyAction";
import { Tag } from "@/components/flash/ui";
import { Fact, KitchenBanner } from "@/components/food/KitchenBanner";
import { configuredPrice, useCart } from "@/lib/cart";
import { cedis, minutes } from "@/lib/flash/format";
import { activeDiscountPercent, discountLabel, discountOn } from "@/lib/flash/pricing";
import type { MenuItem, Restaurant } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

/**
 * Ordering a dish.
 *
 * The dish, its portion and what can be added to it, then the one button that
 * puts it in the bag. The price in the title is the portion; the price on the
 * button is the whole dish — portion, extras and how many — so the number the
 * customer commits to is the one they see.
 */
export function DishOrder({
  restaurant,
  item,
}: {
  restaurant: Restaurant;
  item: MenuItem;
}) {
  const cart = useCart();
  const [sizeId, setSizeId] = useState(item.sizes[0]?.id ?? "");
  const [toppingIds, setToppingIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const inCart = cart.lines.some((line) => line.menuItemId === item.id);

  const size = item.sizes.find((entry) => entry.id === sizeId) ?? item.sizes[0];
  const discountPercent = activeDiscountPercent(item);
  const total = configuredPrice(item, { sizeId, toppingIds }) * quantity;
  const netTotal = total - discountOn(total, discountPercent);

  function toggleTopping(id: string) {
    setToppingIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function addToCart() {
    cart.add(
      item,
      {
        id: restaurant.id,
        name: restaurant.name,
        deliveryFee: restaurant.deliveryFee,
        distanceKm: restaurant.distanceKm,
        etaMinutes: restaurant.etaMinutes,
        neighbourhood: restaurant.neighbourhood,
      },
      { sizeId, toppingIds },
    );
  }

  return (
    <div className="pb-28">
      <KitchenBanner
        image={item.image}
        title={item.name}
        subtitle={item.tagline}
        badge={discountPercent > 0 ? discountLabel(discountPercent) : undefined}
        backHref={`/food/${restaurant.slug}`}
        backLabel="Back to the kitchen"
        facts={[
          <span key="price" className="font-bold text-ink">
            {cedis((size?.price ?? item.price) - discountOn(size?.price ?? item.price, discountPercent))}
          </span>,
          <span key="size" className="flex items-center gap-1.5">
            <Fact icon="bowl" />
            {size?.name ?? "Regular"}
          </span>,
          <span key="eta" className="flex items-center gap-1.5">
            <Fact icon="timer" />
            {minutes(restaurant.etaMinutes)}
          </span>,
        ]}
      />

      <div className="px-5 pt-4">
        <p className="text-[13px] leading-relaxed text-muted">{item.description}</p>

        {item.vegetarian ? (
          <span className="mt-2 inline-flex">
            <Tag>Vegetarian</Tag>
          </span>
        ) : null}
      </div>

      <section className="mt-6 px-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">Select size</h2>
          <span className="rounded-full bg-surface-2 px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.06em] text-muted">
            Required
          </span>
        </div>

        <ul className="mt-1.5">
          {item.sizes.map((entry) => {
            const selected = entry.id === size?.id;

            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setSizeId(entry.id)}
                  aria-pressed={selected}
                  className="flex w-full items-center gap-3 rounded-[12px] py-2.5 text-left transition active:scale-[0.99]"
                >
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition",
                      selected
                        ? "border-brand-solid bg-brand-solid"
                        : "border-line-strong bg-surface",
                    )}
                  >
                    {selected ? <Icon name="check" size={12} className="text-white" /> : null}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[14px]",
                      selected ? "font-bold text-ink" : "font-medium text-ink-soft",
                    )}
                  >
                    {entry.name}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[13.5px]",
                      selected ? "font-bold text-ink" : "text-muted",
                    )}
                  >
                    {cedis(entry.price)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {item.toppings.length ? (
        <section className="mt-5 px-5">
          <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">Extra toppings</h2>

          <ul className="mt-1.5">
            {item.toppings.map((topping) => {
              const selected = toppingIds.includes(topping.id);

              return (
                <li key={topping.id}>
                  <button
                    type="button"
                    onClick={() => toggleTopping(topping.id)}
                    aria-pressed={selected}
                    className="flex w-full items-center gap-3 rounded-[12px] py-2.5 text-left transition active:scale-[0.99]"
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition",
                        selected
                          ? "border-brand-solid bg-brand-solid"
                          : "border-line-strong bg-surface",
                      )}
                    >
                      {selected ? <Icon name="check" size={12} className="text-white" /> : null}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-[14px]",
                        selected ? "font-bold text-ink" : "font-medium text-ink-soft",
                      )}
                    >
                      {topping.name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[13.5px]",
                        selected ? "font-bold text-ink" : "text-muted",
                      )}
                    >
                      +{cedis(topping.price)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}      <StickyAction>
        <div className="flex h-[48px] shrink-0 items-center gap-1 rounded-full border border-line bg-surface px-1.5">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
            aria-label="One fewer"
            className="grid h-9 w-9 place-items-center rounded-full text-ink transition active:scale-95 disabled:opacity-40"
          >
            <Icon name="minus" size={16} />
          </button>
          <span className="w-5 text-center text-[14px] font-bold text-ink">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.min(20, current + 1))}
            aria-label="One more"
            className="grid h-9 w-9 place-items-center rounded-full text-ink transition active:scale-95"
          >
            <Icon name="plus" size={16} />
          </button>
        </div>

        <SignInGate
          label="Sign in to order"
          className="ml-auto inline-flex h-[48px] flex-1 items-center justify-center rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover lg:max-w-[320px]"
        >
          {inCart ? (
            <Link
              href="/food/checkout"
              className="ml-auto inline-flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover lg:max-w-[320px]"
            >
              <Icon name="arrow-right" size={16} />
              Proceed to checkout
            </Link>
          ) : (
            <button
              type="button"
              onClick={addToCart}
              className="ml-auto inline-flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover active:bg-brand-solid-pressed lg:max-w-[320px]"
            >
              <Icon name="bag" size={16} />
              Add to cart · {cedis(netTotal)}
            </button>
          )}
        </SignInGate>
      </StickyAction>
    </div>
  );
}
