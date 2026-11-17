"use client";

import { Icon } from "@/components/flash/Icon";
import { cn } from "@/lib/utils";

/**
 * A count, one step at a time.
 *
 * The same − n + pill the dish page counts with, lifted into the design system
 * so a party size and a parcel count are counted the same way. The count is
 * the one thing on the ride and the parcel forms that moves the price, so it
 * gets a control of its own rather than a line of text.
 */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 6,
  /** What one step counts, for the button labels — "passenger", "parcel". */
  unit,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-[52px] w-fit items-center gap-1 rounded-full border border-line bg-surface px-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`One fewer ${unit}`}
        className="grid h-11 w-11 place-items-center rounded-full text-ink transition active:scale-95 disabled:opacity-35"
      >
        <Icon name="minus" size={16} />
      </button>

      <span aria-live="polite" className="w-9 text-center text-[16px] font-bold text-ink">
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`One more ${unit}`}
        className="grid h-11 w-11 place-items-center rounded-full text-ink transition active:scale-95 disabled:opacity-35"
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
