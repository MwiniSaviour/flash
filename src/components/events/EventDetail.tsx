"use client";

import Link from "next/link";
import { useState } from "react";

import { Icon } from "@/components/flash/Icon";
import { StickyAction } from "@/components/flash/StickyAction";
import { Tag } from "@/components/flash/ui";import { cedis, dayMonth, distance, timeRange } from "@/lib/flash/format";
import type { Event } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

/**
 * The event page: the picture, the facts, and the ticket tiers.
 *
 * Choosing a tier changes what the call to action says and where it goes, so
 * the price is never a guess and the booking is one tap from the decision.
 */
export function EventDetail({ event }: { event: Event }) {
  const [tierId, setTierId] = useState(event.tiers[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  const tier = event.tiers.find((item) => item.id === tierId) ?? event.tiers[0];
  const total = tier ? tier.price * quantity : 0;

  return (
    <div className="pb-28">
      <div className="relative h-[300px] w-full overflow-hidden bg-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.image.src}
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

        <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {event.categories.map((category) => (
              <Tag key={category} tone="onMedia">
                {category}
              </Tag>
            ))}
          </div>
          <h1 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-[-0.03em] text-white">
            {event.title}
          </h1>
          <p className="mt-1 text-[13px] text-white/85">{event.subtitle}</p>
        </div>
      </div>

      <div className="px-5">
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <Icon name="calendar" size={16} className="mt-0.5 shrink-0 text-brand" />
            <p className="text-[14px] text-ink">
              {dayMonth(event.date)} · {timeRange(event.startTime, event.endTime)}
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <Icon name="map-pin" size={16} className="mt-0.5 shrink-0 text-brand" />
            <p className="text-[14px] text-ink">
              {event.venue}, {event.neighbourhood}, {event.city}
              <span className="text-muted"> · {distance(event.distanceKm)}</span>
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <Icon name="heart" size={16} className="mt-0.5 shrink-0 text-brand" />
            <p className="text-[14px] text-ink">
              {event.going.toLocaleString("en-GB")} going
              <span className="text-muted"> · {event.capacity.toLocaleString("en-GB")} capacity</span>
            </p>
          </div>
        </div>

        <p className="mt-5 text-[14px] leading-[1.65] text-muted">{event.description}</p>

        <section className="mt-6">
          <h2 className="text-[17px] font-bold tracking-[-0.015em] text-ink">Choose your ticket</h2>

          <ul className="mt-3 space-y-2.5">
            {event.tiers.map((item) => {
              const selected = item.id === tierId;
              const soldOut = item.available <= 0;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={soldOut}
                    aria-pressed={selected}
                    onClick={() => setTierId(item.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-[14px] border p-3 text-left transition",
                      selected
                        ? "border-brand/45 bg-brand-soft/50"
                        : "border-line/90 bg-surface hover:border-line-strong",
                      soldOut && "opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition",
                        selected ? "border-brand bg-brand" : "border-line-strong",
                      )}
                      aria-hidden="true"
                    >
                      {selected ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      ) : null}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[14.5px] font-semibold text-ink">{item.name}</span>
                        <span className="shrink-0 text-[14px] font-bold text-ink">
                          {cedis(item.price)}
                        </span>
                      </span>
                      <span className="mt-1 block text-[12.5px] leading-snug text-muted">
                        {item.description}
                      </span>
                      <span className="mt-1.5 block text-[11.5px] text-muted-soft">
                        {soldOut ? "Sold out" : `${item.available} left`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-[17px] font-bold tracking-[-0.015em] text-ink">How many?</h2>
          <div className="mt-3 flex items-center gap-4 rounded-[14px] border border-line/90 bg-surface p-3">
            <span className="text-[14px] text-ink">
              {quantity} {quantity === 1 ? "ticket" : "tickets"}
            </span>
            <span className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1}
                aria-label="One ticket fewer"
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink transition active:scale-95 disabled:opacity-40"
              >
                <Icon name="minus" size={16} />
              </button>
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(6, value + 1))}
                disabled={quantity >= 6}
                aria-label="One ticket more"
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink transition active:scale-95 disabled:opacity-40"
              >
                <Icon name="plus" size={16} />
              </button>
            </span>
          </div>
        </section>
      </div>

      <StickyAction>
        <div className="min-w-0">
          <p className="text-[11.5px] text-muted">
            {tier ? tier.name : "General Admission"} × {quantity}
          </p>
          <p className="text-[17px] font-bold tracking-[-0.02em] text-ink">{cedis(total)}</p>
        </div>
        <Link
          href={`/events/${event.slug}/checkout?tier=${tier?.id ?? ""}&qty=${quantity}`}
          className="ml-auto inline-flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover active:bg-brand-solid-pressed lg:max-w-[320px]"
        >
          Get tickets
          <Icon name="arrow-right" size={16} />
        </Link>
      </StickyAction>
    </div>
  );
}
