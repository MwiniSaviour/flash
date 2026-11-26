import { cn } from "@/lib/utils";

/**
 * The ScalDive mark.
 *
 * Five rounded bars in the brand orange — the reference app's waveform, kept
 * because it is the one graphic the product owns, and re-pointed at what ScalDive
 * actually does: a signal that arrives fast. Drawn as SVG so it stays crisp on
 * every density and can flip to white over imagery.
 */
export function FlashMark({
  className,
  color = "#FC5303",
  height = 30,
}: {
  className?: string;
  color?: string;
  height?: number;
}) {
  const width = (height / 30) * 31;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 31 30"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g fill={color}>
        <rect x="0" y="11.5" width="3" height="7" rx="1.5" />
        <rect x="5.6" y="7.6" width="3.6" height="14.8" rx="1.8" />
        <rect x="12.1" y="0" width="4.2" height="30" rx="2.1" />
        <rect x="19.2" y="7.6" width="3.6" height="14.8" rx="1.8" />
        <rect x="25.4" y="11.5" width="3" height="7" rx="1.5" />
      </g>
    </svg>
  );
}

/**
 * The wordmark lock-up: the mark beside SCALDIVE / "Experience the best!".
 *
 * The reference app stacks a heavy name over a wide-tracked category line
 * (PROTOTYPE / RADIO). ScalDive keeps that structure but sets its own promise in
 * sentence case, so the longer line still reads at header size.
 */
export function FlashLogo({
  tone = "ink",
  size = "md",
  className,
  withWordmark = true,
}: {
  tone?: "ink" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
  withWordmark?: boolean;
}) {
  const scale = size === "lg" ? 1.45 : size === "sm" ? 0.8 : 1;
  const wordColor = tone === "light" ? "#FFFFFF" : "#14120F";

  return (
    <span
      className={cn("inline-flex items-center gap-[9px]", className)}
      style={{ height: 30 * scale }}
      aria-label="ScalDive — Experience the best!"
      role="img"
    >
      <FlashMark height={30 * scale} color="#FC5303" />
      {withWordmark ? (
        <span className="flex flex-col" style={{ lineHeight: 1 }}>
          <span
            className="font-extrabold uppercase"
            style={{
              color: wordColor,
              fontSize: 19 * scale,
              letterSpacing: "0.015em",
              lineHeight: 1,
            }}
          >
            ScalDive
          </span>
          <span
            className="font-semibold whitespace-nowrap"
            style={{
              color: tone === "light" ? "rgba(255,255,255,0.92)" : "#6c665f",
              fontSize: Math.min(12, Math.max(9, 10 * scale)),
              letterSpacing: "0.005em",
              marginTop: 3 * scale,
              marginLeft: 1.5 * scale,
              lineHeight: 1,
            }}
          >
            Experience the best!
          </span>
        </span>
      ) : null}
    </span>
  );
}

/**
 * The pulse strip — the mark's bars, given the reference app's living
 * equalizer as a job. It is the one animated element in the system: the brand
 * graphic that says something is moving.
 */
export function PulseStrip({
  bars = 9,
  height = 16,
  className,
}: {
  bars?: number;
  height?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("pulse-bar", className)}
      style={{ height }}
      aria-hidden="true"
    >
      {Array.from({ length: bars }, (_, index) => (
        <span
          key={index}
          className="w-[3px] origin-bottom rounded-full bg-brand motion-safe:animate-eq"
          style={{
            height: `${44 + ((index * 7) % 5) * 14}%`,
            animationDelay: `${index * 85}ms`,
          }}
        />
      ))}
    </span>
  );
}

/**
 * The pulse meter — the mark's bars used as a position indicator.
 *
 * One lit bar per slide in the home carousel: the brand's own gesture for
 * "you are here", which is why the pagination is a pulse and not three dots.
 */
export function PulseMeter({
  count,
  active,
  className,
  onSelect,
}: {
  count: number;
  active: number;
  className?: string;
  onSelect?: (index: number) => void;
}) {
  return (
    <span className={cn("inline-flex items-end gap-[3px]", className)}>
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === active;
        const heights = [9, 14, 20, 14, 9];
        const height = heights[index % heights.length];

        if (!onSelect) {
          return (
            <span
              key={index}
              className={cn(
                "w-[3px] rounded-full transition-all duration-300",
                isActive ? "bg-brand" : "bg-white/35",
              )}
              style={{ height }}
              aria-hidden="true"
            />
          );
        }

        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={isActive ? "true" : undefined}
            className="group flex h-5 w-[7px] items-end justify-center"
          >
            <span
              className={cn(
                "w-[3px] rounded-full transition-all duration-300 group-active:bg-brand",
                isActive ? "bg-brand" : "bg-white/35",
              )}
              style={{ height }}
            />
          </button>
        );
      })}
    </span>
  );
}
