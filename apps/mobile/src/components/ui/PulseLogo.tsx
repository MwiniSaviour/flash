import { cn } from "~/lib/cn";

/**
 * The ScalDive wordmark: five rounded waveform bars + the ScalDive lock-up.
 *
 * The bars are the brand's only logo graphic — drawn in SVG (not a raster asset)
 * so the mark stays crisp on every density and can flip to white over imagery,
 * exactly as it does on the onboarding screen.
 */
export function PulseLogo({
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
  const bar = "#FC5303";
  const wordColor = tone === "light" ? "#FFFFFF" : "#131A26";

  return (
    <span
      className={cn("inline-flex items-center gap-[9px]", className)}
      style={{ height: 30 * scale }}
      aria-label="ScalDive — Experience the best!"
      role="img"
    >
      <svg
        width={34 * scale}
        height={30 * scale}
        viewBox="0 0 34 30"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <g fill={bar}>
          <rect x="0" y="12" width="3.1" height="6" rx="1.55" />
          <rect x="6.1" y="8.4" width="3.7" height="13.2" rx="1.85" />
          <rect x="13.1" y="0" width="4.2" height="30" rx="2.1" />
          <rect x="20.6" y="8.4" width="3.7" height="13.2" rx="1.85" />
          <rect x="27.5" y="12" width="3.1" height="6" rx="1.55" />
        </g>
      </svg>
      {withWordmark ? (
        <span className="flex flex-col" style={{ lineHeight: 1 }}>
          <span
            className="font-extrabold uppercase"
            style={{
              color: wordColor,
              fontSize: 17.5 * scale,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            ScalDive
          </span>
          <span
            className="font-semibold whitespace-nowrap"
            style={{
              color: tone === "light" ? "rgba(255,255,255,0.92)" : "#131A26",
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

/** Just the waveform bars, for station artwork and inline brand marks. */
export function PulseBars({
  className,
  color = "#FC5303",
  height = 24,
}: {
  className?: string;
  color?: string;
  height?: number;
}) {
  return (
    <svg
      className={className}
      width={(height / 30) * 31}
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
