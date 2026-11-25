import { cn } from "~/lib/cn";

/**
 * The Flash lock-up for the native shell: the five-bar pulse mark beside
 * FLASH / "Experience the best!". Drawn in SVG so it stays crisp on every
 * density and can flip to white over the full-bleed onboarding artwork.
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
  const wordColor = tone === "light" ? "#FFFFFF" : "var(--color-ink)";

  return (
    <span
      className={cn("inline-flex items-center gap-[9px]", className)}
      style={{ height: 30 * scale }}
      aria-label="Flash — Experience the best!"
      role="img"
    >
      <svg
        width={31 * scale}
        height={30 * scale}
        viewBox="0 0 31 30"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <g fill="var(--color-brand)">
          <rect x="0" y="11.5" width="3" height="7" rx="1.5" />
          <rect x="5.6" y="7.6" width="3.6" height="14.8" rx="1.8" />
          <rect x="12.1" y="0" width="4.2" height="30" rx="2.1" />
          <rect x="19.2" y="7.6" width="3.6" height="14.8" rx="1.8" />
          <rect x="25.4" y="11.5" width="3" height="7" rx="1.5" />
        </g>
      </svg>
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
            Flash
          </span>
          <span
            className="font-semibold whitespace-nowrap"
            style={{
              color: tone === "light" ? "rgba(255,255,255,0.92)" : "var(--color-muted)",
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
