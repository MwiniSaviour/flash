"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SignInGate } from "@/components/auth/SignInGate";
import { SoldOutRequest } from "@/components/events/SoldOutRequest";
import { Icon } from "@/components/flash/Icon";
import { StickyAction } from "@/components/flash/StickyAction";
import { Tag } from "@/components/flash/ui";
import { priceLabel } from "@/lib/flash/format";
import { useCart } from "@/lib/cart";
import type { Event } from "@/lib/flash/types";
import { deliverySrcSet, deliveryUrl } from "@/lib/media/url";

/**
 * The event page: the picture, the facts, and the ticket tiers.
 *
 * Each tier has its own count. Several tiers can be chosen in one visit, and
 * the only ceiling is the number the planner has left for sale.
 */
export function EventDetail({ event }: { event: Event }) {
  const router = useRouter();
  const cart = useCart();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [requestTierId, setRequestTierId] = useState<string | null>(null);

  function change(tierId: string, by: number, max: number) {
    setQuantities((current) => {
      const next = Math.max(0, Math.min(max, (current[tierId] ?? 0) + by));
      const updated = { ...current, [tierId]: next };
      if (next === 0) delete updated[tierId];
      return updated;
    });
  }

  const chosen = event.tiers
    .map((tier) => ({ tier, quantity: quantities[tier.id] ?? 0 }))
    .filter((line) => line.quantity > 0);

  const total = chosen.reduce((sum, line) => sum + line.tier.price * line.quantity, 0);
  const count = chosen.reduce((sum, line) => sum + line.quantity, 0);

  function proceed() {
    for (const line of chosen) {
      for (let index = 0; index < line.quantity; index += 1) {
        cart.addTicket({
          eventId: event.id,
          eventSlug: event.slug,
          eventTitle: event.title,
          tierId: line.tier.id,
          tierName: line.tier.name,
          price: line.tier.price,
          image: event.image,
        });
      }
    }
    router.push("/events/checkout");
  }

  return (
    <div className="pb-28">
      <div className="relative h-[300px] w-full overflow-hidden bg-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={deliveryUrl(event.image.src, 1600)}
          srcSet={deliverySrcSet(event.image.src)}
          alt={event.image.alt}
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35" />

        <Link
          href="/events"
          aria-label="Back to events"
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/20 backdrop-blur-md transition active:scale-95"
        >
          <Icon name="chevron-left" size={20} />
        </Link>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <Tag tone="onMedia">{event.date}</Tag>
          <h1 className="mt-2 text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-white">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="px-5 pt-5">
        <p className="text-[12.5px] font-medium text-muted">{event.venue}</p>
        <p className="mt-0.5 text-[12.5px] text-muted">
          {event.neighbourhood}, {event.city} · {event.distanceKm} km away
        </p>

        <section className="mt-5">
          <h2 className="text-[17px] font-bold tracking-[-0.015em] text-ink">Choose your tickets</h2>
          <p className="mt-1 text-[12.5px] text-muted">
            Add as many as you need from each tier.
          </p>

          <ul className="mt-3 space-y-2.5">
            {event.tiers.map((item) => {
              const soldOut = item.available <= 0 || item.salesClosed;
              const quantity = quantities[item.id] ?? 0;

              return (
                <li
                  key={item.id}
                  className={`rounded-[16px] border p-3.5 transition ${
                    quantity > 0 ? "border-brand bg-brand-soft/30" : "border-line/90 bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14.5px] font-semibold text-ink">{item.name}</p>
                      <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
                        {item.description}
                      </p>
                      <p className="mt-1 text-[11.5px] text-muted-soft">
                        {soldOut ? "Sold out" : `${item.available} left`}
                      </p>
                    </div>
                    <p className="shrink-0 text-[14px] font-bold text-ink">
                      {priceLabel(item.price)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-line/70 pt-3">
                    {soldOut ? (
                      <SignInGate
                        label="Sign in to ask"
                        className="flex h-9 items-center rounded-[10px] border border-line bg-surface px-3 text-[12.5px] font-semibold text-brand-ink"
                      >
                        <button
                          type="button"
                          onClick={() => setRequestTierId(item.id)}
                          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-surface px-3 text-[12.5px] font-semibold text-ink"
                        >
                          <Icon name="bell" size={14} />
                          Ask for a place
                        </button>
                      </SignInGate>
                    ) : (
                      <span className="text-[12px] text-muted">
                        {quantity > 0 ? `${quantity} selected` : "Tap + to add"}
                      </span>
                    )}

                    {!soldOut ? (
                      <span className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => change(item.id, -1, item.available)}
                          disabled={quantity === 0}
                          aria-label={`One fewer ${item.name} ticket`}
                          className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink disabled:opacity-40"
                        >
                          <Icon name="minus" size={16} />
                        </button>
                        <span className="w-6 text-center text-[14px] font-bold text-ink">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => change(item.id, 1, item.available)}
                          disabled={quantity >= item.available}
                          aria-label={`One more ${item.name} ticket`}
                          className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink disabled:opacity-40"
                        >
                          <Icon name="plus" size={16} />
                        </button>
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {requestTierId ? (
          <div className="mt-4">
            <SoldOutRequest
              eventId={event.id}
              tierId={requestTierId}
              tierName={event.tiers.find((tier) => tier.id === requestTierId)?.name ?? "Tier"}
            />
          </div>
        ) : null}
      </div>

      <StickyAction>
        <div className="min-w-0">
          <p className="text-[11.5px] text-muted">
            {count > 0 ? `${count} ${count === 1 ? "ticket" : "tickets"}` : "No tickets chosen yet"}
          </p>
          <p className="text-[17px] font-bold tracking-[-0.02em] text-ink">{priceLabel(total)}</p>
        </div>
        <SignInGate
          label="Sign in to book"
          className="ml-auto inline-flex h-[48px] flex-1 items-center justify-center rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover lg:max-w-[320px]"
        >
          <button
            type="button"
            onClick={proceed}
            disabled={count === 0}
            className="ml-auto inline-flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover disabled:opacity-50 lg:max-w-[320px]"
          >
            Proceed to checkout
            <Icon name="arrow-right" size={16} />
          </button>
        </SignInGate>
      </StickyAction>
    </div>
  );
}
