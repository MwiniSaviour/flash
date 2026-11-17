import { cn } from "~/lib/cn";
import { usePlayer } from "~/content/PlayerProvider";

/**
 * The brand's waveform, used three ways in the mock: as hero artwork, as the
 * "now playing" affordance on the trending row and the Up Next rail.
 *
 * While a station is playing the bars animate (staggered scaleY); under
 * `prefers-reduced-motion` they keep their static profile so nothing jitters.
 */
export function Waveform({
  bars = 26,
  height = 18,
  className,
  animated,
  color = "currentColor",
}: {
  bars?: number;
  height?: number;
  className?: string;
  animated?: boolean;
  color?: string;
}) {
  const { levels, isPlaying } = usePlayer();
  const pattern = Array.from({ length: bars }, (_, index) => levels[index % levels.length]);
  const shouldAnimate = animated ?? false;

  return (
    <span
      className={cn("flex items-end gap-[2.5px]", className)}
      style={{ height }}
      aria-hidden="true"
    >
      {pattern.map((level, index) => (
        <span
          key={index}
          className={cn("w-[2.5px] rounded-full", shouldAnimate && isPlaying && "motion-safe:animate-eq")}
          style={{
            height: `${Math.max(18, level * 100)}%`,
            backgroundColor: color,
            animationDelay: shouldAnimate && isPlaying ? `${(index % 9) * 90}ms` : undefined,
            transformOrigin: "bottom",
          }}
        />
      ))}
    </span>
  );
}
