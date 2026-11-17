"use client";

import { Icon } from "@/components/flash/Icon";
import { Price } from "@/components/flash/ui";
import { useBooking } from "@/lib/booking";
import { distance } from "@/lib/flash/format";
import type { RideQuote } from "@/lib/flash/types";

/**
 * The ride brief on the home screen.
 *
 * A ride is a decision, not a browse, so this card states the two places, the
 * trip and the price in one line each — then hands the booking to the sheet,
 * which opens over the home screen rather than taking the customer away from
 * it.
 */
export function RideBriefCard({ quote }: { quote: RideQuote }) {
  const { open } = useBooking();

  const cheapest = quote.classes.reduce((lowest, item) =>
    item.price < lowest.price ? item : lowest,
  );

  return (
    <section className="px-5">
      <div className="rounded-[20px] border border-line/90 bg-surface p-4 shadow-[0_1px_2px_rgb(23_26_31/0.04)]">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-brand-soft text-brand-ink">
            <Icon name="ride" size={17} />
          </span>
          <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">Get a ride</h2>
        </div>

        <div className="mt-3.5 space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{quote.pickup}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full border-2 border-muted-soft" />
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{quote.dropoff}</span>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-line/80 pt-3.5">
          <span className="flex items-center gap-2 text-[12.5px] text-muted">
            <Icon name="route" size={15} className="text-muted-soft" />
            {distance(quote.distanceKm)} · {quote.durationMinutes} min
          </span>
          <span className="text-[12.5px] text-muted">
            from <Price amount={cheapest.price} size="sm" className="inline" />
          </span>
        </div>

        <button
          type="button"
          onClick={() => open({ kind: "ride", dropoff: quote.dropoff })}
          className="mt-3.5 flex h-[46px] w-full items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[14px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover active:bg-brand-solid-pressed"
        >
          Book a ride
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </section>
  );
}
