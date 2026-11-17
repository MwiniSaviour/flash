"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import type { Schedule } from "@/components/flash/SchedulePicker";
import { LocationFields } from "@/components/flash/LocationFields";
import { SchedulePicker, scheduleInstant, scheduleLabel } from "@/components/flash/SchedulePicker";
import { SegmentedControl } from "@/components/flash/SegmentedControl";
import { Sheet } from "@/components/flash/Sheet";
import { Stepper } from "@/components/flash/Stepper";
import { DemoNote, Field, SectionHeading, StatusBadge } from "@/components/flash/ui";
import { sendParcel } from "@/lib/flash/actions";
import {
  MAX_PARCELS,
  parcelQuote,
  parcelSizes,
  parcelTypes,
  quoteParcel,
  type ParcelSize,
  type ParcelType,
} from "@/lib/flash/data/parcels";
import { cedis, distance } from "@/lib/flash/format";
import type { SavedPlace } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

/**
 * Send a parcel.
 *
 * A courier needs six answers: where it is picked up, who is receiving it and
 * where they are, what is inside it, how big it is, how many there are and
 * when it goes. The sheet asks them in that order and quotes from them, so the
 * price on the button is the price that will be charged.
 */
export function ParcelBooking({
  savedPlaces,
  onClose,
}: {
  savedPlaces: SavedPlace[];
  onClose: () => void;
}) {
  const [type, setType] = useState<ParcelType>(parcelTypes[0]);
  const [size, setSize] = useState<ParcelSize>("small");
  const [quantity, setQuantity] = useState(1);
  const [schedule, setSchedule] = useState<Schedule>({ mode: "now" });
  const [pickup, setPickup] = useState("Oxford Street, Osu");
  const [dropoff, setDropoff] = useState("Ring Road, Ridge");
  const [recipient, setRecipient] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState<{ trackingNumber: string; demo: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const quote = quoteParcel(type, size, parcelQuote.distanceKm);
  // Every parcel is charged on its own, so the count is what moves the price.
  const total = quote.price * quantity;

  function dispatch() {
    setError(null);

    startTransition(async () => {
      const result = await sendParcel({
        parcelType: type.id,
        parcelSize: size,
        quantity,
        pickup,
        dropoff,
        recipient,
        phone,
        details,
        scheduledFor: scheduleInstant(schedule),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSent({ trackingNumber: result.data.trackingNumber, demo: result.data.demo });
    });
  }

  if (sent) {
    return (
      <Sheet title="Send a parcel" onClose={onClose}>
        <div className="rounded-[20px] border border-line/90 bg-surface p-5 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success-ink">
            <Icon name="check" size={28} />
          </span>
          <h3 className="mt-4 text-[21px] font-bold tracking-[-0.02em] text-ink">Parcel booked</h3>
          <p className="mx-auto mt-1.5 max-w-[34ch] text-[13.5px] leading-relaxed text-muted">
            {schedule.mode === "later"
              ? `Your ${quantity === 1 ? "parcel" : `${quantity} parcels`} of ${type.name.toLowerCase()} will be collected ${scheduleLabel(schedule)}. It is on the Track tab with its own reference.`
              : `A courier is being assigned for your ${quantity === 1 ? "parcel" : `${quantity} parcels`} of ${type.name.toLowerCase()}. It is on the Track tab now, with its own reference.`}
          </p>

          <div className="mt-4 rounded-[14px] bg-surface-2/70 px-4 py-3 text-left">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] text-muted">Tracking number</span>
              <span className="font-mono text-[13px] font-bold tracking-[0.06em] text-ink">
                {sent.trackingNumber}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[12px] text-muted">Pick-up</span>
              <span className="truncate text-[12.5px] font-semibold text-ink">{pickup}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className="text-[12px] text-muted">Drop-off</span>
              <span className="truncate text-[12.5px] font-semibold text-ink">{dropoff}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className="text-[12px] text-muted">When</span>
              <span className="truncate text-[12.5px] font-semibold text-ink">
                {scheduleLabel(schedule)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className="text-[12px] text-muted">Recipient</span>
              <span className="truncate text-[12.5px] font-semibold text-ink">{recipient}</span>
            </div>
            {phone ? (
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="text-[12px] text-muted">Phone</span>
                <span className="truncate text-[12.5px] font-semibold text-ink">{phone}</span>
              </div>
            ) : null}
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className="text-[12px] text-muted">Parcels</span>
              <span className="truncate text-[12.5px] font-semibold text-ink">
                {quantity} × {type.name}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className="text-[12px] text-muted">Price</span>
              <span className="text-[12.5px] font-semibold text-ink">{cedis(total)}</span>
            </div>
          </div>

          {sent.demo ? (
            <p className="mt-2 text-[12px] text-muted-soft">
              Demo mode — no database is connected, so nothing was saved.
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
      title="Send a parcel"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11.5px] text-muted">
              {type.name} · {quantity === 1 ? "1 parcel" : `${quantity} parcels`}
            </p>
            <p className="text-[17px] font-bold tracking-[-0.02em] text-ink">{cedis(total)}</p>
          </div>
          <button
            type="button"
            onClick={dispatch}
            disabled={isPending}
            className="ml-auto inline-flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover active:bg-brand-solid-pressed disabled:opacity-80"
          >
            {isPending ? "Booking a courier…" : "Send parcel"}
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      }
    >
      <LocationFields
        pickup={pickup}
        dropoff={dropoff}
        onPickupChange={setPickup}
        onDropoffChange={setDropoff}
        savedPlaces={savedPlaces}
        onSavedPlace={(place) => setDropoff(place.detail)}
      />

      <section className="mt-6">
        <SectionHeading title="Who is receiving it?" />

        <div className="mt-3 space-y-2.5">
          <Field label="Full name" icon="user">
            <input
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="Who should the courier hand it to?"
              aria-label="Recipient name"
              autoComplete="name"
              className="w-full bg-transparent text-[16px] text-ink placeholder:text-muted focus:outline-none"
            />
          </Field>

          <Field label="Phone number" icon="phone">
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="So the courier can call them"
              aria-label="Recipient phone number"
              autoComplete="tel"
              inputMode="tel"
              type="tel"
              className="w-full bg-transparent text-[16px] text-ink placeholder:text-muted focus:outline-none"
            />
          </Field>
        </div>
      </section>

      <section className="mt-6">
        <SectionHeading title="What are you sending?" />

        <ul className="mt-3 space-y-2">
          {parcelTypes.map((item) => {
            const selected = item.id === type.id;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setType(item)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[14px] border p-3 text-left transition",
                    selected
                      ? "border-brand/45 bg-brand-soft/50"
                      : "border-line/90 bg-surface hover:border-line-strong",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-[11px]",
                      selected ? "bg-brand-solid text-white" : "bg-surface-2 text-icon-idle",
                    )}
                    aria-hidden="true"
                  >
                    <Icon name={item.icon} size={19} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-ink">{item.name}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-muted">{item.detail}</span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block text-[14px] font-bold text-ink">
                      {cedis(item.price)}
                      {quantity > 1 ? (
                        <span className="text-[11px] font-medium text-muted"> each</span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-muted">{item.etaMinutes} min</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <Field label="Details (optional)" className="mt-3">
          <input
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Books for my sister, handle with care"
            aria-label="Parcel details"
            className="w-full bg-transparent text-[16px] text-ink placeholder:text-muted focus:outline-none"
          />
        </Field>
      </section>

      <section className="mt-6">
        <SectionHeading title="How big is it?" />
        <SegmentedControl
          className="mt-3"
          ariaLabel="Parcel size"
          value={size}
          onChange={setSize}
          options={parcelSizes.map((item) => ({ value: item.id, label: item.label }))}
        />
        <p className="mt-2 text-[12.5px] text-muted">
          {parcelSizes.find((item) => item.id === size)?.detail}
        </p>
      </section>

      <section className="mt-6">
        <SectionHeading title="How many parcels?" />

        <div className="mt-3 flex items-center gap-3">
          <Stepper value={quantity} onChange={setQuantity} min={1} max={MAX_PARCELS} unit="parcel" />
          <p className="text-[13px] text-muted">
            {quantity === 1 ? "1 parcel" : `${quantity} parcels`}
          </p>
        </div>

        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          Each parcel is charged on its own, so the count is what moves the price.
        </p>
      </section>

      <SchedulePicker className="mt-6" value={schedule} onChange={setSchedule} />


      <section className="mt-6">
        <div className="rounded-[16px] border border-line/90 bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-brand-soft text-brand-ink">
                <Icon name="truck" size={18} />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-ink">{quote.courier.name}</p>
                <p className="mt-0.5 text-[11.5px] text-muted">{quote.courier.vehicle}</p>
              </div>
            </div>
            <StatusBadge
              tone={schedule.mode === "later" ? "warning" : "success"}
              icon={schedule.mode === "later" ? "calendar" : "clock"}
            >
              {schedule.mode === "later" ? "Scheduled" : `${quote.etaMinutes} min`}
            </StatusBadge>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line/80 pt-3">
            <span className="flex items-center gap-1.5 text-[12.5px] text-muted">
              <Icon name="route" size={14} className="text-muted-soft" />
              {distance(quote.distanceKm)} · {quote.durationMinutes} min
            </span>
            <span className="text-right">
              <span className="block text-[15px] font-bold text-ink">{cedis(total)}</span>
              {quantity > 1 ? (
                <span className="mt-0.5 block text-[11.5px] text-muted">
                  {quantity} × {cedis(quote.price)}
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </section>

      <DemoNote className="px-0 pt-5" />

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
