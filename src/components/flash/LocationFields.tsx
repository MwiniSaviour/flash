"use client";

import { SearchableSelect } from "@/components/flash/SearchableSelect";
import type { GeoPoint } from "@/lib/flash/geo";
import type { SavedPlace } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

/**
 * The where-to block: the two addresses every trip needs, in one white card.
 *
 * Both rows are searchable so a rider can start or end somewhere other than
 * where they are standing. "Use precise location" fills the row with the
 * device's real position, which is what distance pricing uses.
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
  onPickupChange: (value: string, point?: GeoPoint) => void;
  onDropoffChange: (value: string, point?: GeoPoint) => void;
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
        <SearchableSelect
          label="Pick-up"
          value={pickup}
          onChange={onPickupChange}
          placeholder="Search a town or street"
          precise
          field="pickup"
        />
      </div>

      <div className="flex items-start gap-3 border-t border-line/80 px-3.5 py-3">
        <span
          className="mt-[9px] h-2.5 w-2.5 shrink-0 rounded-full border-2 border-muted-soft"
          aria-hidden="true"
        />
        <SearchableSelect
          label="Drop-off"
          value={dropoff}
          onChange={onDropoffChange}
          placeholder="Where are you going?"
          precise
          field="dropoff"
        />
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
