"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { setMenuItemPrice, setTierPrice } from "@/lib/flash/business-actions";
import { cn } from "@/lib/utils";

/**
 * The price editor.
 *
 * A price is the number a business changes most often, so it is edited in
 * place: type the new figure, save it, and the menu is priced. The server
 * checks the business owns the thing and rounds the figure.
 *
 * The confirmation is read from the server's own price, not from a flag, so it
 * survives the refresh that follows the save.
 */
export function PriceEditor({
  id,
  kind,
  price,
  label,
}: {
  id: string;
  kind: "dish" | "tier";
  price: number;
  label: string;
}) {
  const [value, setValue] = useState(String(price));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const lastSaved = useRef(price);

  useEffect(() => {
    if (price === lastSaved.current) return;

    lastSaved.current = price;
    setValue(String(price));
    setSaved(true);

    const timer = setTimeout(() => setSaved(false), 2200);
    return () => clearTimeout(timer);
  }, [price]);

  function save() {
    const next = Number(value);

    if (!Number.isFinite(next) || next < 0) {
      setError("Set a price.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result =
        kind === "dish"
          ? await setMenuItemPrice({ menuItemId: id, price: next })
          : await setTierPrice({ tierId: id, price: next });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      lastSaved.current = result.data.price;
      setValue(String(result.data.price));
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex h-9 items-center gap-1 rounded-[10px] border border-line bg-surface px-2 focus-within:border-brand/50">
        <span className="text-[11.5px] font-semibold text-muted">GHC</span>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          inputMode="numeric"
          aria-label={`Price for ${label}`}
          className="w-12 bg-transparent text-[13.5px] font-bold text-ink focus:outline-none"
        />
      </label>

      <button
        type="button"
        onClick={save}
        disabled={isPending}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-[10px] px-2.5 text-[12.5px] font-semibold transition",
          saved
            ? "bg-success-soft text-success-ink"
            : "border border-line bg-surface text-ink hover:bg-surface-2",
        )}
      >
        {saved ? (
          <>
            <Icon name="check" size={13} />
            Saved
          </>
        ) : (
          "Save"
        )}
      </button>

      {error ? (
        <span role="alert" className="text-[12px] text-danger-ink">
          {error}
        </span>
      ) : null}
    </div>
  );
}
