"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { publishMenuItem } from "@/lib/flash/business-actions";

/**
 * Add a dish.
 *
 * A dish needs a name, a line about it and a price. Nothing else — the
 * portions and the extras come from the kitchen's settings.
 */
export function AddDishForm({ restaurantId }: { restaurantId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);

    startTransition(async () => {
      const result = await publishMenuItem({
        restaurantId,
        name,
        description,
        price: Number(price),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setName("");
      setDescription("");
      setPrice("");
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
        Add a dish
      </button>
    );
  }

  return (
    <div className="rounded-[16px] border border-line/90 bg-surface p-3.5">
      <p className="text-[14px] font-bold tracking-[-0.01em] text-ink">A new dish</p>

      <label className="mt-3 block">
        <span className="mb-1 block text-[12px] font-semibold text-muted">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Banku & grilled tilapia"
          className="h-11 w-full rounded-[11px] border border-line bg-surface px-3 text-[13.5px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
        />
      </label>

      <label className="mt-2.5 block">
        <span className="mb-1 block text-[12px] font-semibold text-muted">What is in it</span>
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Fermented banku, whole tilapia, pepper sauce"
          className="h-11 w-full rounded-[11px] border border-line bg-surface px-3 text-[13.5px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
        />
      </label>

      <label className="mt-2.5 block">
        <span className="mb-1 block text-[12px] font-semibold text-muted">Price</span>
        <span className="flex h-11 items-center gap-1.5 rounded-[11px] border border-line bg-surface px-3 focus-within:border-brand/50">
          <span className="text-[12.5px] font-semibold text-muted">GHC</span>
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="numeric"
            placeholder="45"
            className="min-w-0 flex-1 bg-transparent text-[13.5px] font-semibold text-ink placeholder:text-muted focus:outline-none"
          />
        </span>
      </label>

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
          {done ? "On the menu" : isPending ? "Adding…" : "Add to the menu"}
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
