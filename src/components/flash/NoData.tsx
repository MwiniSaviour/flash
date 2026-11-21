import Link from "next/link";

import { Icon } from "@/components/flash/Icon";

/**
 * The empty state for a page with no genuine data yet.
 *
 * The illustration and its colours are Flash's own: brand strokes on the
 * paper ground, no stock photography and no invented records behind it.
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
      <svg
        viewBox="0 0 220 150"
        className="mx-auto h-[150px] w-[220px]"
        role="img"
        aria-label="An empty dashboard waiting for data"
      >
        <rect x="8" y="14" width="72" height="52" rx="8" fill="var(--color-surface)" stroke="var(--color-brand)" strokeOpacity="0.45" />
        <circle cx="26" cy="32" r="7" fill="none" stroke="var(--color-brand)" strokeWidth="3" />
        <path d="M26 21v-4M26 47v-4M15 32h-4M41 32h-4" stroke="var(--color-brand)" strokeWidth="3" strokeLinecap="round" />
        <path d="M18 55h34" stroke="var(--color-brand)" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />

        <rect x="140" y="14" width="72" height="52" rx="8" fill="var(--color-surface)" stroke="var(--color-brand)" strokeOpacity="0.45" />
        <path d="M154 42v-8M164 42V26M174 42V32M184 42V20" stroke="var(--color-brand)" strokeWidth="4" strokeLinecap="round" />

        <g stroke="var(--color-brand-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M110 64c-16 0-28 12-28 28v26h56V92c0-16-12-28-28-28Z" fill="var(--color-surface)" />
          <circle cx="110" cy="58" r="16" fill="var(--color-surface)" />
          <path d="M100 56c2-8 14-10 19-3" />
          <path d="M104 64c4 3 9 3 13 0" />
          <path d="M82 92 62 80M138 92l20-12" />
          <path d="M62 80c-6-2-9 2-6 7l8 9M158 80c6-2 9 2 6 7l-8 9" />
          <path d="M92 118v20h36v-20" fill="var(--color-brand-soft)" />
        </g>
      </svg>

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
