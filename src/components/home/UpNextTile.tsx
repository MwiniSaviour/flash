"use client";

import Link from "next/link";

import { useBooking, type BookingKind } from "@/lib/booking";
import type { ImageAsset } from "@/lib/flash/types";

/**
 * One tile in the home "Up Next" rail.
 *
 * The reference app's programme tile — artwork, the name, when it starts and
 * who is behind it. ScalDive keeps that shape and fills it with what is next
 * across the three services: the next show, the next ride, the next meal and
 * the next ticket.
 *
 * The ride tile opens the booking sheet instead of a page, with the ride it
 * describes already filled in.
 */
export function UpNextTile({
  href,
  artwork,
  title,
  meta,
  sub,
  booking,
}: {
  href?: string;
  artwork: ImageAsset;
  title: string;
  meta: string;
  sub: string;
  booking?: { kind: BookingKind; dropoff?: string };
}) {
  const { open } = useBooking();

  const body = (
    <>
      <span className="relative block aspect-square w-full overflow-hidden rounded-[14px] bg-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artwork.src}
          alt={artwork.alt}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </span>

      <span className="mt-2 block line-clamp-2 min-h-[30px] text-[12px] font-semibold leading-[1.25] tracking-[-0.01em] text-ink">
        {title}
      </span>
      <span className="mt-1 block truncate text-[11px] leading-snug text-muted">{meta}</span>
      <span className="block truncate text-[11px] leading-snug text-muted">{sub}</span>
    </>
  );

  const shell =
    "block w-[124px] shrink-0 snap-start text-left lg:w-auto lg:shrink transition active:scale-[0.97]";

  if (booking) {
    return (
      <button type="button" onClick={() => open(booking)} className={shell}>
        {body}
      </button>
    );
  }

  return (
    <Link href={href ?? "/"} className={shell}>
      {body}
    </Link>
  );
}
