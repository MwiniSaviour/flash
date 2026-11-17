"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { setEventDiscount, setRestaurantDiscount } from "@/lib/flash/business-actions";
import { discountLabel } from "@/lib/flash/pricing";

/**
 * The offer editor.
 *
 * One number: how much this week takes off the food or the tickets. It shows
 * on the storefront, on the card in the list and on the order, so it is set in
 * one place.
 */
export function OfferEditor({
  kind,
  id,
  percent,
}: {
  kind: "restaurant" | "event";
  id: string;
  percent: number;
}) {
  const [value, setValue] = useState(String(percent));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const lastSaved = useRef(percent);

  useEffect(() => {
    if (percent === lastSaved.current) return;

    lastSaved.current = percent;
    setValue(String(percent));
    setSaved(true);

    const timer = setTimeout(() => setSaved(false), 2200);
    return () => clearTimeout(timer);
  }, [percent]);

  const noun = kind === "restaurant" ? "order" : "ticket";
  const place = kind === "restaurant" ? "storefront" : "event page";
  const live = Number(value) > 0 ? Number(value) : percent;

  function save() {
    const next = Number(value);

    if (!Number.isFinite(next) || next < 0 || next > 100) {
      setError("An offer runs between 0 and 100 percent.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result =
        kind === "restaurant"
          ? await setRestaurantDiscount({ restaurantId: id, percent: next })
          : await setEventDiscount({ eventId: id, percent: next });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      lastSaved.current = result.data.percent;
      setValue(String(result.data.percent));
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-9 items-center gap-1 rounded-[10px] border border-line bg-surface px-2 focus-within:border-brand/50">
          <span className="text-[11.5px] font-semibold text-muted">% off</span>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            inputMode="numeric"
            aria-label="Discount percentage"
            className="w-10 bg-transparent text-[13.5px] font-bold text-ink focus:outline-none"
          />
        </label>

        {live > 0 ? (
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11.5px] font-bold text-brand-ink">
            {discountLabel(live)}
          </span>
        ) : null}

        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className={
            saved
              ? "inline-flex h-9 items-center gap-1 rounded-[10px] bg-success-soft px-2.5 text-[12.5px] font-semibold text-success-ink"
              : "inline-flex h-9 items-center gap-1 rounded-[10px] border border-line bg-surface px-2.5 text-[12.5px] font-semibold text-ink transition hover:bg-surface-2"
          }
        >
          {saved ? (
            <>
              <Icon name="check" size={13} />
              Saved
            </>
          ) : (
            "Save offer"
          )}
        </button>
      </div>

      <p className="mt-1.5 text-[12px] leading-snug text-muted">
        {live > 0
          ? `${discountLabel(live)} is showing on your ${place} and comes off every ${noun}.`
          : `No offer on this week. Put one up and it shows on the ${place}.`}
      </p>

      {error ? (
        <p role="alert" className="mt-1 text-[12px] text-danger-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
