"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { updateCover } from "@/lib/flash/actions";
import { COVER_IMAGES } from "@/lib/flash/covers";
import type { Restaurant } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

/**
 * The cover picker.
 *
 * The photograph a customer sees first. It leads the kitchen page, the card in
 * the food list and the poster, so changing it here changes all three.
 */
export function CoverPicker({ kitchen }: { kitchen: Restaurant }) {
  const [cover, setCover] = useState(kitchen.image.src);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const chosen = COVER_IMAGES.find((image) => image.src === cover);

  function save() {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateCover({ restaurantId: kitchen.id, imageSrc: cover });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div>
      <div className="overflow-hidden rounded-[16px] border border-line/90 bg-surface">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={chosen?.src ?? kitchen.image.src}
            alt={chosen?.alt ?? kitchen.image.alt}
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          <p className="absolute inset-x-0 bottom-0 px-4 pb-3 text-[15px] font-bold tracking-[-0.015em] text-white">
            {kitchen.name}
          </p>
        </div>
      </div>

      <ul className="mt-3 grid grid-cols-3 gap-2">
        {COVER_IMAGES.map((image) => {
          const active = image.src === cover;

          return (
            <li key={image.src}>
              <button
                type="button"
                onClick={() => setCover(image.src)}
                aria-pressed={active}
                aria-label={`Use ${image.alt} as the cover`}
                className={cn(
                  "block w-full overflow-hidden rounded-[12px] border-2 transition active:scale-[0.97]",
                  active ? "border-brand-solid" : "border-transparent",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.src}
                  alt=""
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending || cover === kitchen.image.src}
          className={cn(
            "inline-flex h-[46px] items-center justify-center gap-2 rounded-[12px] px-4 text-[14px] font-bold transition",
            saved
              ? "bg-success-soft text-success-ink"
              : "bg-brand-solid text-white shadow-brand hover:bg-brand-solid-hover",
          )}
        >
          <Icon name="check" size={15} />
          {saved ? "Cover updated" : isPending ? "Saving…" : "Save cover"}
        </button>
        {error ? (
          <p role="alert" className="text-[13px] text-danger-ink">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
