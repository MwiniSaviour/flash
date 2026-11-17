"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { PhotoUpload } from "@/components/flash/PhotoUpload";
import { publishEvent } from "@/lib/flash/business-actions";

/**
 * Post an event.
 *
 * What a promoter needs to put an event on Flash: what it is, where it is,
 * when it is, and what a ticket costs. A poster can be uploaded when
 * Cloudinary is connected; otherwise the catalogue supplies one.
 */
export function AddEventForm({ canUpload = false }: { canUpload?: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [neighbourhood, setNeighbourhood] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("22:00");
  const [tierName, setTierName] = useState("General Admission");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [imageSrc, setImageSrc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);

    startTransition(async () => {
      const result = await publishEvent({
        title,
        venue,
        neighbourhood,
        date,
        startTime,
        endTime,
        tierName,
        price: Number(price),
        capacity: Number(capacity),
        imageSrc: imageSrc || undefined,
        imageAlt: imageSrc ? `Poster for ${title || "a new event"}` : undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setTitle("");
      setVenue("");
      setPrice("");
      setImageSrc("");
      setDone(true);
      setTimeout(() => setDone(false), 2200);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-1.5 rounded-[12px] border border-dashed border-line-strong bg-surface/60 px-3.5 text-[13px] font-semibold text-ink transition hover:border-brand/45 hover:text-brand-ink"
      >
        <Icon name="plus" size={15} />
        Post an event
      </button>
    );
  }

  return (
    <div className="rounded-[16px] border border-line/90 bg-surface p-3.5">
      <p className="text-[14px] font-bold tracking-[-0.01em] text-ink">A new event</p>

      <label className="mt-3 block">
        <span className="mb-1 block text-[12px] font-semibold text-muted">What is it</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Sunset Live Sessions"
          className="h-11 w-full rounded-[11px] border border-line bg-surface px-3 text-[13.5px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
        />
      </label>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted">Where</span>
          <input
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
            placeholder="Labadi Beach"
            className="h-11 w-full rounded-[11px] border border-line bg-surface px-3 text-[13.5px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted">Area</span>
          <input
            value={neighbourhood}
            onChange={(event) => setNeighbourhood(event.target.value)}
            placeholder="Osu"
            className="h-11 w-full rounded-[11px] border border-line bg-surface px-3 text-[13.5px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2.5">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted">Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-11 w-full rounded-[11px] border border-line bg-surface px-2.5 text-[13px] text-ink focus:border-brand/50 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted">From</span>
          <input
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="h-11 w-full rounded-[11px] border border-line bg-surface px-2.5 text-[13px] text-ink focus:border-brand/50 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted">Until</span>
          <input
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="h-11 w-full rounded-[11px] border border-line bg-surface px-2.5 text-[13px] text-ink focus:border-brand/50 focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted">Ticket</span>
          <input
            value={tierName}
            onChange={(event) => setTierName(event.target.value)}
            placeholder="General Admission"
            className="h-11 w-full rounded-[11px] border border-line bg-surface px-3 text-[13.5px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted">Price</span>
          <span className="flex h-11 items-center gap-1.5 rounded-[11px] border border-line bg-surface px-3 focus-within:border-brand/50">
            <span className="text-[12.5px] font-semibold text-muted">GHC</span>
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              inputMode="numeric"
              placeholder="120"
              className="min-w-0 flex-1 bg-transparent text-[13.5px] font-semibold text-ink placeholder:text-muted focus:outline-none"
            />
          </span>
        </label>
      </div>

      <label className="mt-2.5 block">
        <span className="mb-1 block text-[12px] font-semibold text-muted">How many tickets</span>
        <input
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
          inputMode="numeric"
          className="h-11 w-full rounded-[11px] border border-line bg-surface px-3 text-[13.5px] text-ink focus:border-brand/50 focus:outline-none"
        />
      </label>

      {canUpload ? (
        <div className="mt-2.5">
          <PhotoUpload
            kind="poster"
            label="Upload an event poster"
            value={imageSrc}
            onChange={setImageSrc}
          />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-[12.5px] text-danger-ink">
          {error}
        </p>
      ) : null}

      <div className="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-brand-solid text-[14px] font-bold text-white transition hover:bg-brand-solid-hover disabled:opacity-60"
        >
          <Icon name={done ? "check" : "plus"} size={15} />
          {done ? "Published" : isPending ? "Publishing…" : "Publish the event"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-11 items-center rounded-[12px] border border-line bg-surface px-4 text-[13.5px] font-semibold text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
