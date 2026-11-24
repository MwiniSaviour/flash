import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

/** Section heading + trailing "See all" link, as used on Home and Events. */
export function SectionHeading({
  title,
  action,
  actionHref,
  onAction,
  className,
}: {
  title: string;
  action?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <h2 className="text-[21px] font-bold leading-[1.15] tracking-[-0.015em] text-ink">{title}</h2>
      {action ? (
        actionHref ? (
          <Link
            href={actionHref}
            className="-mb-0.5 flex shrink-0 items-center gap-1 text-[12px] font-semibold text-muted transition-colors hover:text-ink"
          >
            {action}
            <Icon name="chevron-right" size={13} className="translate-y-[0.5px]" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="-mb-0.5 flex shrink-0 items-center gap-1 text-[12px] font-semibold text-muted transition-colors hover:text-ink"
          >
            {action}
            <Icon name="chevron-right" size={13} className="translate-y-[0.5px]" />
          </button>
        )
      ) : null}
    </div>
  );
}

/** Screen title block: the page's single h1 plus a supporting line. */
export function ScreenHeader({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={cn("px-5", className)}>
      <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">{title}</h1>
      {subtitle ? <p className="mt-[4px] text-[13px] leading-snug text-muted">{subtitle}</p> : null}
    </header>
  );
}

/**
 * The white calendar chip every dated surface carries (SAT / 26 / APR).
 * Screen readers get the full date from the label, not from the three lines.
 */
export function DateBadge({
  weekday,
  day,
  month,
  tone = "light",
  size = "md",
  className,
}: {
  weekday: string;
  day: string;
  month: string;
  tone?: "light" | "glass";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims =
    size === "sm"
      ? {
          box: "h-[40px] w-[35px] rounded-[7px]",
          weekday: "text-[7.5px]",
          day: "text-[13.5px]",
          month: "text-[7.5px]",
        }
      : size === "lg"
        ? {
            box: "h-[52px] w-[46px] rounded-[8px]",
            weekday: "text-[8.5px]",
            day: "text-[17px]",
            month: "text-[8.5px]",
          }
        : {
            box: "h-[44px] w-[39px] rounded-[7px]",
            weekday: "text-[8px]",
            day: "text-[15px]",
            month: "text-[8px]",
          };

  return (
    <span
      className={cn(
        "flex flex-col items-center justify-center text-center leading-none",
        dims.box,
        tone === "light"
          ? "bg-white text-ink shadow-[0_2px_10px_rgb(0_0_0/0.16)]"
          : "bg-black/45 text-white ring-1 ring-white/25 backdrop-blur-md",
        className,
      )}
    >
      <span className={cn("font-semibold tracking-[0.04em] opacity-75", dims.weekday)}>{weekday}</span>
      <span className={cn("font-bold tracking-[-0.02em]", dims.day)}>{day}</span>
      <span className={cn("font-semibold tracking-[0.04em] opacity-75", dims.month)}>{month}</span>
    </span>
  );
}

/** Neutral tag pill (Music / Festival / Comedy…). */
export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "onMedia";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[6px] px-[8px] py-[4px] text-[11px] font-medium leading-none",
        tone === "neutral"
          ? "bg-surface-2 text-muted"
          : "bg-white/20 text-white ring-1 ring-white/25 backdrop-blur-sm",
      )}
    >
      {children}
    </span>
  );
}

export type StatusTone = "success" | "warning" | "neutral" | "danger" | "brand";

const statusStyles: Record<StatusTone, string> = {
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-surface-2 text-muted",
  danger: "bg-danger-soft text-danger",
  brand: "bg-brand-soft text-brand-ink",
};

/**
 * Status is never colour-only: every badge carries an icon and a word.
 */
export function StatusBadge({
  tone = "success",
  icon = "check-circle",
  children,
}: {
  tone?: StatusTone;
  icon?: IconName;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-[4px] text-[12px] font-semibold leading-none",
        statusStyles[tone],
      )}
    >
      <Icon name={icon} size={11} />
      {children}
    </span>
  );
}

/** Primary action. White on the solid orange, which clears AA at this size. */
export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  icon,
}: {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: IconName;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[12px] font-bold transition-colors active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50";
  const sizes = {
    sm: "h-[36px] px-3.5 text-[13px]",
    md: "h-[44px] px-4 text-[14px]",
    lg: "h-[52px] px-5 text-[15px]",
  }[size];
  const variants = {
    primary: "bg-brand-solid text-white hover:bg-brand-solid-hover active:bg-brand-solid-pressed shadow-brand",
    secondary: "border border-line bg-surface text-ink hover:bg-surface-2",
    ghost: "text-brand-ink hover:bg-brand-soft",
  }[variant];

  const content = (
    <>
      {children}
      {icon ? <Icon name={icon} size={15} /> : null}
    </>
  );

  const classes = cn(base, sizes, variants, className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes}>
      {content}
    </button>
  );
}

/** A labelled text field — search, pick-up, drop-off. */
export function Field({
  label,
  icon,
  children,
  className,
}: {
  label: string;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[12px] font-semibold text-muted">{label}</span>
      <span className="flex h-[46px] items-center gap-2 rounded-[12px] border border-line bg-surface px-3 focus-within:border-brand/50">
        {icon ? <Icon name={icon} size={17} className="shrink-0 text-muted" /> : null}
        {children}
      </span>
    </label>
  );
}

/** The empty state: a short line, a border and no apology. */
export function EmptyState({
  message,
  action,
  href,
}: {
  message: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="rounded-[14px] border border-dashed border-line-strong/70 bg-surface/60 px-4 py-8 text-center">
      <p className="text-[13px] leading-relaxed text-muted">{message}</p>
      {action && href ? (
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-ink"
        >
          {action}
          <Icon name="chevron-right" size={13} />
        </Link>
      ) : null}
    </div>
  );
}

/**
 * The demo disclosure.
 *
 * Every price, rating and availability figure in this build is synthetic. The
 * screens that show them say so, once, quietly, rather than letting the
 * interface pass read as a live listings feed.
 */
export function DemoNote() {
  return null;
}

/** A round avatar with a graceful fallback to initials. */
export function Avatar({
  src,
  alt,
  name,
  size = 36,
  className,
}: {
  src?: string;
  alt: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  if (!src) {
    const initials = (name ?? "F")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-brand-soft text-[12px] font-bold text-brand-ink",
          className,
        )}
        style={{ width: size, height: size }}
        role="img"
        aria-label={alt}
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
      loading="lazy"
    />
  );
}

/** Star rating with the count beside it. */
export function Rating({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[12px] font-semibold text-ink", className)}>
      <Icon name="star" size={12} filled className="text-brand" />
      {value.toFixed(1)}
      {count ? <span className="font-medium text-muted">({count.toLocaleString("en-GB")})</span> : null}
    </span>
  );
}

/** A price, always whole cedis. */
export function Price({
  amount,
  className,
  size = "md",
}: {
  amount: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-[12px]",
    md: "text-[14px]",
    lg: "text-[19px]",
  }[size];

  return (
    <span className={cn("font-bold tracking-[-0.01em] text-ink", sizes, className)}>
      GHC{amount}
    </span>
  );
}
