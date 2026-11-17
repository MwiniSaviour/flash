"use client";

import { useMemo, useState } from "react";

import { Icon } from "@/components/flash/Icon";
import { DemoNote, SectionHeading } from "@/components/flash/ui";
import { RouteMap } from "@/components/track/RouteMap";
import {
  CourierBar,
  DeliveryCard,
  GreetingHeader,
  RouteEndpoints,
} from "@/components/track/TrackingChrome";
import { BookingActions } from "@/components/booking/BookingActions";
import type { Delivery, PastDelivery } from "@/lib/flash/data/tracking";
import type { FlashUser } from "@/lib/flash/types";
import { cedis } from "@/lib/flash/format";
import { useLiveRefresh } from "@/lib/use-live-refresh";

/**
 * Track — what is on its way to you.
 *
 * The screen answers one question at a glance: what is moving, where is it and
 * when does it land. Every card opens the delivery's own page, and the map
 * below always shows the delivery at the top of the list, so the list and the
 * picture never disagree.
 */
export function TrackingScreen({
  deliveries,
  past,
  user,
}: {
  deliveries: Delivery[];
  past: PastDelivery[];
  user: FlashUser;
}) {
  const [query, setQuery] = useState("");

  // The deliveries move on their own; the screen keeps up.
  useLiveRefresh(15000);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return deliveries;

    return deliveries.filter((delivery) =>
      [delivery.id, delivery.title, delivery.reference, delivery.rider.name]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [deliveries, query]);

  const selected = visible[0] ?? deliveries[0];

  return (
    <div className="pb-5">
      <h1 className="sr-only">Track your orders, parcels and rides</h1>

      <GreetingHeader user={user} />

      <div className="mt-1 px-5">
        <label className="flex h-[46px] items-center gap-2 rounded-full border border-line bg-surface px-3.5 focus-within:border-brand/50">
          <Icon name="search" size={17} className="shrink-0 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Track by order number or reference"
            aria-label="Track by order number or reference"
            className="w-full bg-transparent text-[13px] text-ink placeholder:text-muted focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-3">
        <BookingActions
          items={[
            { kind: "parcel", label: "Send a parcel", icon: "package" },
            { kind: "ride", label: "Book a ride", icon: "ride" },
          ]}
        />
      </div>

      <section className="mt-6">
        <SectionHeading title="Active delivery" className="px-5" />
        <div className="mt-3 space-y-2.5 px-5">
          {visible.map((delivery) => (
            <DeliveryCard key={delivery.id} delivery={delivery} />
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mx-5 mt-3 rounded-[14px] border border-dashed border-line-strong/70 px-4 py-8 text-center text-[13px] leading-relaxed text-muted">
            Nothing matches that number. Try the reference from your confirmation.
          </p>
        ) : null}
      </section>

      {selected ? (
        <section className="mt-6 px-5">
          <SectionHeading title="On the map" />

          <RouteMap
            fromLabel={selected.from}
            toLabel={selected.to}
            fromPlace={selected.fromPlace}
            toPlace={selected.toPlace}
            progress={selected.progress}
            className="mt-3 h-[210px]"
          />

          <div className="mt-2.5">
            <RouteEndpoints delivery={selected} />
          </div>

          <div className="mt-2.5">
            <CourierBar delivery={selected} />
          </div>

          <ol className="mt-4 space-y-2.5">
            {selected.steps.map((step) => (
              <li key={step.label} className="flex items-center gap-2.5">
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                    step.done
                      ? "bg-brand-solid text-white"
                      : step.current
                        ? "bg-brand-soft text-brand-ink"
                        : "bg-surface-2 text-muted-soft"
                  }`}
                  aria-hidden="true"
                >
                  {step.done ? <Icon name="check" size={11} /> : null}
                </span>
                <span className={step.done ? "text-[13.5px] text-ink" : "text-[13.5px] text-muted"}>
                  {step.label}
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-4 font-mono text-[11px] tracking-[0.06em] text-muted-soft">
            Reference {selected.reference}
          </p>
        </section>
      ) : null}

      <section className="mt-7">
        <SectionHeading title="Delivered" className="px-5" />
        <ul className="mt-3 space-y-2 px-5">
          {past.map((delivery) => (
            <li key={delivery.id}>
              <div className="flex items-center gap-3 rounded-[14px] border border-line/90 bg-surface p-2.5">
                <span className="relative block h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[12px] bg-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={delivery.image.src}
                    alt={delivery.image.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">
                    {delivery.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-muted">
                    {delivery.subtitle}
                  </span>
                  <span className="mt-1 block text-[11.5px] text-muted-soft">
                    {delivery.when} · {cedis(delivery.price)}
                  </span>
                </span>
                <Icon name="check-circle" size={18} className="shrink-0 text-success-ink" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <DemoNote />
    </div>
  );
}

