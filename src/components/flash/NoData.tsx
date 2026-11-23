import Link from "next/link";

import { Icon } from "@/components/flash/Icon";

/**
 * The empty state for a page with no genuine data yet.
 *
 * The parcel-and-magnifier illustration is a local asset, catalogued in
 * docs/assets-provenance.md. No invented records sit behind the message.
 */
export function NoData({
  title = "No data yet",
  message,
  action,
  href,
  className,
}: {
  title?: string;
  message: string;
  action?: string;
  href?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[20px] border border-dashed border-brand/30 bg-brand-soft/30 px-5 py-10 text-center ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/images/no-data-found.png"
        alt="An open parcel box under a magnifying glass, with nothing inside"
        className="mx-auto h-auto w-[200px]"
        loading="lazy"
      />

      <h2 className="mt-3 text-[17px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-[36ch] text-[13px] leading-relaxed text-muted">{message}</p>

      {action && href ? (
        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-solid px-4 py-2 text-[13px] font-bold text-white transition hover:bg-brand-solid-hover"
        >
          {action}
          <Icon name="chevron-right" size={14} />
        </Link>
      ) : null}
    </div>
  );
}
