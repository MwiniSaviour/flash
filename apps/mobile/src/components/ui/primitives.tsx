import { cn } from "~/lib/cn";
import { Icon } from "~/components/ui/Icon";

/** The mock's small uppercase "LIVE" marker: red pill, play glyph, white caps. */
export function LivePill({
  className,
  size = "md",
  label = "LIVE",
}: {
  className?: string;
  size?: "sm" | "md";
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[3px] bg-brand font-bold text-white",
        size === "sm" ? "px-1.5 py-[3px] text-[9px]" : "px-[7px] py-[4px] text-[10px]",
        className,
      )}
    >
      <Icon name="play" size={size === "sm" ? 7 : 8} />
      <span className="tracking-[0.06em]">{label}</span>
    </span>
  );
}

/** White calendar chip used on every event surface (SAT / 26 / APR). */
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
      ? { box: "h-[38px] w-[33px] rounded-[5px]", weekday: "text-[7.5px]", day: "text-[13.5px]", month: "text-[7.5px]", gap: "gap-0" }
      : size === "lg"
        ? { box: "h-[50px] w-[44px] rounded-[4px]", weekday: "text-[8.5px]", day: "text-[17px]", month: "text-[8.5px]", gap: "gap-0" }
        : { box: "h-[42px] w-[37px] rounded-[5px]", weekday: "text-[8px]", day: "text-[15px]", month: "text-[8px]", gap: "gap-0" };

  return (
    <span
      className={cn(
        "flex flex-col items-center justify-center text-center leading-none",
        dims.box,
        dims.gap,
        tone === "light"
          ? "bg-white text-ink shadow-[0_2px_10px_rgb(0_0_0/0.18)]"
          : "bg-black/40 text-white ring-1 ring-white/25 backdrop-blur-md",
        className,
      )}
    >
      <span className={cn("font-semibold tracking-[0.04em] opacity-80", dims.weekday)}>{weekday}</span>
      <span className={cn("font-bold tracking-[-0.02em]", dims.day)}>{day}</span>
      <span className={cn("font-semibold tracking-[0.04em] opacity-80", dims.month)}>{month}</span>
    </span>
  );
}

/** Neutral tag pill (Music / Festival / Comedy…). */
export function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "onMedia" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] px-[7px] py-[4px] text-[10.5px] font-medium leading-none",
        tone === "neutral"
          ? "bg-[#ece7df] text-[#5a6068]"
          : "bg-white/18 text-white ring-1 ring-white/20 backdrop-blur-sm",
      )}
    >
      {children}
    </span>
  );
}

/** Ticket state: green "Confirmed", amber "Pending". */
export function StatusBadge({ status }: { status: "confirmed" | "pending" | "past" }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-[3.5px] text-[12px] font-semibold text-warning">
        <Icon name="clock" size={11} />
        Pending
      </span>
    );
  }
  if (status === "past") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-[3.5px] text-[12px] font-semibold text-muted">
        <Icon name="check" size={11} />
        Attended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-[3.5px] text-[12px] font-semibold text-success">
      <Icon name="check-circle" size={11} />
      Confirmed
    </span>
  );
}

/** Section heading + trailing "See All" link, as used on Home and Events. */
export function SectionHeading({
  title,
  action,
  onAction,
  className,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <h2 className="font-display text-[21px] leading-[1.1] font-bold tracking-[-0.012em] text-ink">
        {title}
      </h2>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="-mb-0.5 flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-muted transition active:opacity-60"
        >
          {action}
          <Icon name="chevron-right" size={12} className="translate-y-[0.5px]" />
        </button>
      ) : null}
    </div>
  );
}

/** Screen title block: 28px heading + 13.5px muted subtitle. */
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
      <h1 className="text-[26px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">{title}</h1>
      {subtitle ? <p className="mt-[3px] text-[12.5px] leading-snug text-muted">{subtitle}</p> : null}
    </header>
  );
}
