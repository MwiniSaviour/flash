"use client";

import { BookingActions } from "@/components/booking/BookingActions";
import { Icon } from "@/components/flash/Icon";
import { SectionHeading } from "@/components/flash/ui";
import { RouteMap } from "@/components/track/RouteMap";
import {
  CourierBar,
  DeliveryCard,
  GreetingHeader,
  RouteEndpoints,
} from "@/components/track/TrackingChrome";
import { useBooking } from "@/lib/booking";
import type { Delivery } from "@/lib/flash/data/tracking";
import type { FlashUser, SavedPlace } from "@/lib/flash/types";

/**
 * Ride — the ride you are taking, and the places you go.
 *
 * The booking itself happens in the sheet the "Book a ride" button opens, so
 * this page stays what it is good at: the ride that is already moving, with
 * its map, its driver and its plate, and the saved places a new ride can
 * start from.
 */
export function RideScreen({
  activeRide,
  user,
  savedPlaces,
}: {
  activeRide: Delivery | undefined;
  user: FlashUser;
  savedPlaces: SavedPlace[];
}) {
  const { open } = useBooking();

  return (
    <div className="pb-5">
      <h1 className="sr-only">Book a ride across Accra</h1>

      <GreetingHeader user={user} />

      <div className="mt-1">
        <BookingActions
          items={[
            { kind: "ride", label: "Book a ride", icon: "ride" },
            { kind: "parcel", label: "Send a parcel", icon: "package" },
          ]}
        />
      </div>

      {activeRide ? (
        <section className="mt-6" id="active">
          <SectionHeading title="Active ride" className="px-5" />
          <div className="mt-3 space-y-2.5 px-5">
            <DeliveryCard delivery={activeRide} />
          </div>

          <div className="mt-3 px-5">
            <RouteMap
              fromLabel={activeRide.from}
              toLabel={activeRide.to}
              fromPlace={activeRide.fromPlace}
              toPlace={activeRide.toPlace}
              progress={activeRide.progress}
              className="h-[210px]"
            />
          </div>

          <div className="mt-2.5 px-5">
            <RouteEndpoints delivery={activeRide} />
          </div>

          <div className="mt-2.5 px-5">
            <CourierBar delivery={activeRide} />
          </div>
        </section>
      ) : null}

      <section className="mt-7 px-5">
        <SectionHeading title="Saved places" />

        <p className="mt-2 text-[12.5px] text-muted">
          Tap a place to book a ride there.
        </p>

        <ul className="mt-3 space-y-2">
          {savedPlaces.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => open({ kind: "ride", dropoff: place.detail })}
                className="flex w-full items-center gap-3 rounded-[14px] border border-line/90 bg-surface p-3 text-left transition hover:border-line-strong active:scale-[0.99]"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-brand-soft text-brand-ink"
                  aria-hidden="true"
                >
                  <Icon name="map-pin" size={17} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-ink">{place.label}</span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-muted">{place.detail}</span>
                </span>

                <Icon name="arrow-right" size={16} className="shrink-0 text-muted-soft" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
