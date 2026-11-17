"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/**
 * The segmented control.
 *
 * One filled segment at a time, in the brand's solid orange — the active
 * segment carries the shadow, so the state reads without relying on colour
 * alone.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex gap-[3px] rounded-[12px] bg-surface-3/70 p-[3px]", className)}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-[36px] flex-1 rounded-[9px] text-[13px] font-semibold transition-colors",
              active
                ? "bg-brand-solid text-white shadow-brand"
                : "text-icon-idle hover:text-ink",
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span className={cn("ml-1.5 text-[11.5px]", active ? "text-white/80" : "text-muted")}>
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
