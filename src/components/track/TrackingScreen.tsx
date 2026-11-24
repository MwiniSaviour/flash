"use client";

import { useMemo, useState } from "react";

import { Icon } from "@/components/flash/Icon";
import { NoData } from "@/components/flash/NoData";
import { SectionHeading } from "@/components/flash/ui";
import { DeliveryCard, GreetingHeader } from "@/components/track/TrackingChrome";
import { BookingActions } from "@/components/booking/BookingActions";
import type { Delivery, PastDelivery } from "@/lib/flash/data/tracking";
import type { FlashUser } from "@/lib/flash/types";
import { useLiveTracking } from "@/lib/flash/use-live-tracking";
import { cedis } from "@/lib/flash/format";
import { useLocalPurchases } from "@/lib/flash/local-purchases";
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
  const local = useLocalPurchases();

  // Purchases confirmed in this browser join the server's deliveries at the
  // top, so a paid order is visible before any dispatch assignment exists.
  const allDeliveries = useMemo(
    () => [
      ...local.flatMap((item) => (item.delivery ? [item.delivery] : [])),
      ...deliveries,
    ],
    [local, deliveries],
  );

  // The deliveries move on their own; the screen keeps up. Realtime changes
  // refresh immediately, with the interval as a fallback.
  useLiveRefresh(15000);
  useLiveTracking(allDeliveries[0]?.id, allDeliveries[0]?.kind);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return allDeliveries;

    return allDeliveries.filter((delivery) =>
      [delivery.id, delivery.title, delivery.reference, delivery.rider.name]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [allDeliveries, query]);


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
          <div className="mt-3 px-5">
            <NoData
              message={
                allDeliveries.length === 0
                  ? "No deliveries yet. Book a ride or send a parcel and its live tracking will appear here."
                  : "Nothing matches that number. Try the reference from your confirmation."
              }
            />
          </div>
        ) : null}
      </section>


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
    </div>
  );
}

