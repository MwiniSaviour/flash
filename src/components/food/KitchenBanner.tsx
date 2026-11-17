import Link from "next/link";
import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/flash/Icon";
import type { ImageAsset } from "@/lib/flash/types";
import { cn } from "@/lib/utils";
import { deliverySrcSet, deliveryUrl } from "@/lib/media/url";

/**
 * The banner.
 *
 * The photograph darkened so the type holds, the name, one line under it, and
 * the facts that decide the order in a strip below. The kitchen and the dish
 * both use it, so a dish looks like it belongs to the kitchen it came from.
 */
export function KitchenBanner({
  image,
  title,
  subtitle,
  badge,
  facts,
  backHref,
  backLabel,
}: {
  image: ImageAsset;
  title: string;
  subtitle?: string;
  badge?: string;
  facts: ReactNode[];
  backHref: string;
  backLabel: string;
}) {
  return (
    <>
      <div className="relative h-[220px] w-full overflow-hidden bg-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={deliveryUrl(image.src, 1600)}
          srcSet={deliverySrcSet(image.src)}
          alt={image.alt}
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/42 to-black/32" />

        <Link
          href={backHref}
          aria-label={backLabel}
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/20 backdrop-blur-md transition active:scale-95"
        >
          <Icon name="chevron-left" size={20} />
        </Link>

        <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
          {badge ? (
            <span className="inline-flex rounded-full bg-brand-solid px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              {badge}
            </span>
          ) : null}
          <h1
            className={cn(
              "text-[24px] font-bold leading-[1.1] tracking-[-0.03em] text-white",
              badge ? "mt-2" : "",
            )}
          >
            {title}
          </h1>
          {subtitle ? <p className="mt-1 text-[13px] text-white/85">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line/70 bg-surface px-5 py-2.5 text-[12.5px] text-muted">
        {facts.map((fact, index) => (
          <span
            key={index}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap",
              index > 0 ? "border-l border-line pl-3" : "",
            )}
          >
            {fact}
          </span>
        ))}
      </div>
    </>
  );
}

/** One fact in the strip: an icon and, after it, the value. */
export function Fact({ icon, children }: { icon: IconName; children?: ReactNode }) {
  return (
    <>
      <Icon name={icon} size={13} className="shrink-0 text-muted-soft" />
      {children}
    </>
  );
}
