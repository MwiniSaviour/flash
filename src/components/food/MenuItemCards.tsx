"use client";

import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { Tag } from "@/components/flash/ui";
import type { MenuItem } from "@/lib/flash/types";
import { cn } from "@/lib/utils";
import { deliverySrcSet, deliveryUrl } from "@/lib/media/url";

/**
 * The dish card.
 *
 * The photograph and the price are what the customer decides on, so they sit
 * on the photograph; the name and the line beneath it say what they are
 * looking at. The card opens the dish so the portion and the extras can be
 * chosen, and the round button puts the dish in the bag as it is.
 */
export function MenuItemCard({
  item,
  href,
  onAdd,
  quantity = 0,
}: {
  item: MenuItem;
  href: string;
  onAdd: () => void;
  quantity?: number;
}) {
  return (
    <div
      className={cn(
        "w-[160px] shrink-0 snap-start rounded-[18px] transition-all",
        quantity > 0 && "bg-brand-soft/60 p-1.5 -m-1.5 outline outline-2 outline-brand",
      )}
    >
      <div className="relative">
        <span className="relative block aspect-square w-full overflow-hidden rounded-[14px] bg-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={deliveryUrl(item.image.src, 480)}
          srcSet={deliverySrcSet(item.image.src)}
            alt={item.image.alt}
            className="h-full w-full object-cover"
            loading="lazy"
            draggable={false}
          />

          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[11.5px] font-bold tracking-[-0.01em] text-ink shadow-[0_2px_8px_rgb(20_18_15/0.18)]">
            GHC{item.price}
          </span>

          {quantity > 0 ? (
            <span className="absolute left-2 bottom-2 z-20 rounded-full bg-brand-solid px-2.5 py-1 text-[12px] font-bold text-white shadow-[0_2px_8px_rgb(20_18_15/0.28)]">
              ×{quantity} in bag
            </span>
          ) : null}
        </span>

        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add ${item.name} to your cart`}
          className={cn(
            "absolute bottom-2 right-2 z-20 grid h-11 w-11 place-items-center rounded-full shadow-[0_3px_10px_rgb(20_18_15/0.24)] transition active:scale-95",
            quantity > 0 ? "bg-brand-solid text-white" : "bg-white text-brand",
          )}
        >
          <Icon name={quantity > 0 ? "check" : "plus"} size={19} />
        </button>

        <Link
          href={href}
          className="absolute inset-0 z-10 rounded-[14px]"
          aria-label={`Order ${item.name}`}
        />
      </div>

      <p className="mt-2 line-clamp-2 text-[13.5px] font-semibold leading-tight tracking-[-0.01em] text-ink">
        {item.name}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-muted">
        {item.description}
      </p>

      {item.popular || item.vegetarian ? (
        <span className="mt-1.5 flex items-center gap-1.5">
          {item.popular ? (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-brand-ink">
              Popular
            </span>
          ) : null}
          {item.vegetarian ? <Tag>Veg</Tag> : null}
        </span>
      ) : null}
    </div>
  );
}
