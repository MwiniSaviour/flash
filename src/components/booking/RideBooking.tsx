"use client";

import { useEffect, useState, useTransition } from "react";

import { SignInGate } from "@/components/auth/SignInGate";
import { Icon, type IconName } from "@/components/flash/Icon";
import { PaymentMethods, PaymentNote, type PaymentMethodId } from "@/components/flash/PaymentMethods";
import { LocationFields } from "@/components/flash/LocationFields";
import { LiveMap } from "@/components/flash/LiveMap";
import type { Schedule } from "@/components/flash/SchedulePicker";
import { SchedulePicker, scheduleInstant, scheduleLabel } from "@/components/flash/SchedulePicker";
import { Sheet } from "@/components/flash/Sheet";
import { Stepper } from "@/components/flash/Stepper";
import { Field, SectionHeading, StatusBadge } from "@/components/flash/ui";
import { requestRide } from "@/lib/flash/actions";
import { payWithIntent } from "@/lib/payments/inline";
import { MAX_PASSENGERS } from "@/lib/flash/data/rides";
import { cedis, distance } from "@/lib/flash/format";
import { estimateMinutes, haversineKm, type GeoPoint } from "@/lib/flash/geo";

import type { RideClass, RideQuote, SavedPlace } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

const classIcons: Record<string, IconName> = {
  "flash-bike": "bike",
  "flash-go": "car",
  "flash-comfort": "car",
  "flash-xl": "van",
};

/**
 * Book a ride.
 *
 * The sheet asks the four questions a ride needs — where you start, where you
 * end, how many of you are going, and which ride — and quotes from the answer.
 * It is the same form the Ride screen used to carry, moved into a sheet so
 * booking never costs the customer the screen they came from.
 */
export function RideBooking({
  quote,
  savedPlaces,
  initialDropoff,
  onClose,
}: {
  quote: RideQuote;
  savedPlaces: SavedPlace[];
  initialDropoff?: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<RideClass>(quote.classes[1] ?? quote.classes[0]);
  const [passengers, setPassengers] = useState(1);
  const [pickup, setPickup] = useState(quote.pickup);
  const [dropoff, setDropoff] = useState(initialDropoff ?? quote.dropoff);
  const [pickupPoint, setPickupPoint] = useState<GeoPoint | null>(null);
  const [dropoffPoint, setDropoffPoint] = useState<GeoPoint | null>(null);
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentMethodId>("momo");
  const [schedule, setSchedule] = useState<Schedule>({ mode: "now" });
  const [reference, setReference] = useState<{ value: string; demo: boolean } | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const distanceKm =
    pickupPoint && dropoffPoint
      ? Math.round(haversineKm(pickupPoint, dropoffPoint) * 10) / 10
      : quote.distanceKm;
  const durationMinutes = estimateMinutes(distanceKm);

  // The biggest party the classes can carry, capped by the product limit.
  const maxPassengers = Math.min(
    MAX_PASSENGERS,
    quote.classes.reduce((most, item) => Math.max(most, item.seats), 1),
  );

  /**
   * A party that outgrows the booked ride moves up to the cheapest ride that
   * takes everyone — the fare follows the ride, not the head count.
   */
  function setPartySize(next: number) {
    setPassengers(next);

    setSelected((current) => {
      if (current.seats >= next) return current;

      const fits = quote.classes.filter((item) => item.seats >= next);
      if (fits.length === 0) return current;

      return fits.reduce((cheapest, item) => (item.price < cheapest.price ? item : cheapest));
    });
  }

  function request() {
    setError(null);
    setSearching(true);

    startTransition(async () => {
      const result = await requestRide({
        rideClass: selected.id,
        passengers,
        pickup,
        dropoff,
        pickupPoint: pickupPoint ?? undefined,
        dropoffPoint: dropoffPoint ?? undefined,
        distanceKm,
        durationMinutes,
        phone,
        scheduledFor: scheduleInstant(schedule),
        paymentMethod: method === "cash" ? "pod" : method,
      });

      if (!result.ok) {
        setError(result.error);
        setSearching(false);
        return;
      }

      if (result.data.checkout) {
        await payWithIntent(result.data.checkout, () => {
          setReference({ value: result.data.reference, demo: result.data.demo });
        });
        return;
      }

      setReference({ value: result.data.reference, demo: result.data.demo });

      setReference({ value: result.data.reference, demo: result.data.demo });
    });
  }

  // The rider is being looked for — then the booking is confirmed.
  useEffect(() => {
    if (!searching || reference) return;
    const timer = setTimeout(() => setSearching(false), 2200);
    return () => clearTimeout(timer);
  }, [searching, reference]);

  if (reference) {
    const scheduled = schedule.mode === "later";

    return (
      <Sheet title="Book a ride" onClose={onClose}>
        <div className="rounded-[20px] border border-line/90 bg-surface p-5 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success-ink">
            <Icon name={scheduled ? "calendar" : "check"} size={28} />
          </span>
          <h3 className="mt-4 text-[21px] font-bold tracking-[-0.02em] text-ink">
            {scheduled ? "Ride scheduled" : `${selected.name} is on the way`}
          </h3>
          <p className="mx-auto mt-1.5 max-w-[34ch] text-[13.5px] leading-relaxed text-muted">
            {scheduled
              ? `Your ${selected.name.toLowerCase()} is booked for ${scheduleLabel(schedule)}. It is on the Track tab as Scheduled until the pick-up window opens.`
              : `We are looking for a rider near ${pickup}. Track the ride from the Track tab once it is assigned.`}
          </p>

          <div className="mt-4 rounded-[14px] bg-surface-2/70 px-4 py-3 text-left">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              Pick-up
            </p>
            <p className="mt-1 text-[14px] font-semibold text-ink">{pickup}</p>
            <p className="mt-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              Drop-off
            </p>
            <p className="mt-1 text-[14px] font-semibold text-ink">{dropoff}</p>
            <p className="mt-2 text-[12px] text-muted">
              {distance(distanceKm)} · about {durationMinutes} min
              {pickupPoint && dropoffPoint ? "" : " · estimate from the demo route"}
            </p>
            {pickupPoint && dropoffPoint ? (
              <LiveMap from={pickupPoint} to={dropoffPoint} className="mt-3 h-40 w-full rounded-[12px]" />
            ) : null}
            <p className="mt-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              Party
            </p>
            <p className="mt-1 text-[14px] font-semibold text-ink">
              {passengers === 1 ? "1 passenger" : `${passengers} passengers`} · {selected.name}
            </p>
            {scheduled ? (
              <>
                <p className="mt-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                  When
                </p>
                <p className="mt-1 text-[14px] font-semibold text-ink">{scheduleLabel(schedule)}</p>
              </>
            ) : null}
            <p className="mt-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              Booking reference
            </p>
            <p className="mt-1 font-mono text-[18px] font-bold tracking-[0.06em] text-ink">
              {reference.value}
            </p>
          </div>

          {reference.demo ? (
            <p className="mt-2 text-[12px] text-muted-soft">
              </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 h-[48px] w-full rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover active:bg-brand-solid-pressed"
        >
          Done
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet
      title="Book a ride"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11.5px] text-muted">
              {selected.name} · {passengers === 1 ? "1 passenger" : `${passengers} passengers`}
            </p>
            <p className="text-[17px] font-bold tracking-[-0.02em] text-ink">{cedis(selected.price)}</p>
          </div>
          <SignInGate
            label="Sign in to book"
            className="ml-auto inline-flex h-[48px] flex-1 items-center justify-center rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover"
          >
            <button
              type="button"
              onClick={request}
              disabled={searching || isPending}
              className="ml-auto inline-flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover active:bg-brand-solid-pressed disabled:opacity-80"
            >
              {searching || isPending ? "Finding a rider." : `Request ${selected.name}`}
              {searching || isPending ? (
                <Icon name="timer" size={16} />
              ) : (
                <Icon name="arrow-right" size={16} />
              )}
            </button>
          </SignInGate>
        </div>
      }
    >
      <section className="mb-5 rounded-[16px] border border-line/90 bg-surface p-3.5">
        <PaymentMethods value={method} onChange={(value) => setMethod(value)} />
        <PaymentNote />
      </section>

      <LocationFields
        pickup={pickup}
        dropoff={dropoff}
        onPickupChange={(value, point) => {
          setPickup(value);
          setPickupPoint(point ?? null);
        }}
        onDropoffChange={(value, point) => {
          setDropoff(value);
          setDropoffPoint(point ?? null);
        }}
        savedPlaces={savedPlaces}
        onSavedPlace={(place) => setDropoff(place.detail)}
      />

      {pickupPoint && dropoffPoint ? (
        <LiveMap
          from={pickupPoint}
          to={dropoffPoint}
          className="mt-3 h-36 w-full overflow-hidden rounded-[12px] border border-line/80"
        />
      ) : null}

      <section className="mt-6">
        <SectionHeading title="How can the rider reach you?" />
        <Field label="Phone number" icon="phone" className="mt-3">
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="So the rider can call you"
            aria-label="Phone number"
            autoComplete="tel"
            inputMode="tel"
            type="tel"
            className="w-full bg-transparent text-[16px] text-ink placeholder:text-muted focus:outline-none"
          />
        </Field>
      </section>

      <section className="mt-6">
        <SectionHeading title="How many of you?" />

        <div className="mt-3 flex items-center gap-3">
          <Stepper
            value={passengers}
            onChange={setPartySize}
            min={1}
            max={maxPassengers}
            unit="passenger"
          />
          <p className="text-[13px] text-muted">
            {passengers === 1 ? "1 passenger" : `${passengers} passengers`}
          </p>
        </div>

        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          The fare is for the whole trip, so we book the ride that takes everyone along.
        </p>
      </section>

      <section className="mt-6">
        <SectionHeading title="Choose a ride" />

        <div className="mt-2 flex items-center gap-2 text-[12.5px] text-muted">
          <Icon name="route" size={15} className="text-muted-soft" />
          {distance(quote.distanceKm)} · about {quote.durationMinutes} minutes
        </div>

        <ul className="mt-3 space-y-2.5">
          {quote.classes.map((item) => {
            const isSelected = item.id === selected.id;
            const fits = item.seats >= passengers;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  disabled={!fits}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[14px] border p-3 text-left transition",
                    !fits
                      ? "cursor-not-allowed border-line/90 bg-surface/60 opacity-55"
                      : isSelected
                        ? "border-brand/45 bg-brand-soft/50"
                        : "border-line/90 bg-surface hover:border-line-strong",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-[12px]",
                      isSelected && fits
                        ? "bg-brand-solid text-white"
                        : "bg-surface-2 text-icon-idle",
                    )}
                    aria-hidden="true"
                  >
                    <Icon name={classIcons[item.id] ?? "car"} size={21} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[14.5px] font-semibold text-ink">{item.name}</span>
                      <StatusBadge tone="neutral" icon="user">
                        Up to {item.seats}
                      </StatusBadge>
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                      {fits ? item.description : `Not enough seats for ${passengers}`}
                    </span>
                    {fits ? (
                      <span className="mt-1 block text-[11.5px] font-medium text-brand-ink">
                        {item.perk}
                      </span>
                    ) : null}
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block text-[15px] font-bold tracking-[-0.01em] text-ink">
                      {cedis(item.price)}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-muted">{item.etaMinutes} min</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <SchedulePicker className="mt-6" value={schedule} onChange={setSchedule} />


      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-[12px] border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger-ink"
        >
          {error}
        </p>
      ) : null}
    </Sheet>
  );
}
