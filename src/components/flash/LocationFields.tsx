"use client";

import type { SavedPlace } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

/**
 * The where-to block: the two addresses every trip needs, in one white card.
 *
 * Ride and parcel open with the same two questions — where does it start and
 * where does it end — so they share one component and one field order. The
 * pick-up row carries the filled brand dot (the origin on the route diagram)
 * and the drop-off row the hollow one (the destination). Saved places sit
 * under the drop-off and fill it in a tap.
 *
 * Both rows are real inputs: a booking is only as good as the two addresses
 * the customer typed, so nothing here is a fixed line of text.
 */
export function LocationFields({
  id,
  pickup,
  dropoff,
  onPickupChange,
  onDropoffChange,
  savedPlaces,
  onSavedPlace,
  className,
}: {
  id?: string;
  pickup: string;
  dropoff: string;
  onPickupChange: (value: string) => void;
  onDropoffChange: (value: string) => void;
  savedPlaces?: SavedPlace[];
  onSavedPlace?: (place: SavedPlace) => void;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-[16px] border border-line/90 bg-surface transition-colors focus-within:border-brand/50",
        className,
      )}
    >
      <div className="flex items-start gap-3 px-3.5 py-3">
        <span className="mt-[9px] h-2.5 w-2.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
        <label className="min-w-0 flex-1">
          <span className="block text-[12px] font-semibold leading-tight text-muted">Pick-up</span>
          <input
            value={pickup}
            onChange={(event) => onPickupChange(event.target.value)}
            placeholder="Add a pick-up address"
            aria-label="Pick-up address"
            autoComplete="street-address"
            className="mt-1 w-full bg-transparent text-[16px] leading-snug text-ink placeholder:text-muted focus:outline-none"
          />
        </label>
      </div>

      <div className="flex items-start gap-3 border-t border-line/80 px-3.5 py-3">
        <span
          className="mt-[9px] h-2.5 w-2.5 shrink-0 rounded-full border-2 border-muted-soft"
          aria-hidden="true"
        />
        <label className="min-w-0 flex-1">
          <span className="block text-[12px] font-semibold leading-tight text-muted">Drop-off</span>
          <input
            value={dropoff}
            onChange={(event) => onDropoffChange(event.target.value)}
            placeholder="Add a drop-off address"
            aria-label="Drop-off address"
            autoComplete="off"
            className="mt-1 w-full bg-transparent text-[16px] leading-snug text-ink placeholder:text-muted focus:outline-none"
          />
        </label>
      </div>

      {savedPlaces && savedPlaces.length > 0 && onSavedPlace ? (
        <div className="flex flex-wrap gap-1.5 border-t border-line/80 px-3.5 py-3">
          {savedPlaces.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => onSavedPlace(place)}
              aria-label={`Set the drop-off to ${place.detail}`}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-muted transition hover:border-line-strong hover:text-ink active:scale-95"
            >
              {place.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
