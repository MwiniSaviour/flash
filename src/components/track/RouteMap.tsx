import { LiveMap } from "@/components/flash/LiveMap";

/**
 * The route map on the ride and tracking screens.
 *
 * Street tiles, the two stops and the rider's position all come from live
 * data: the labels are resolved through the geocoder and the map is streamed
 * from the vector-tile CDN. No streets or blocks are drawn by hand.
 */
export function RouteMap({
  fromLabel,
  toLabel,
  fromPlace,
  toPlace,
  progress = 0.6,
  className,
}: {
  fromLabel: string;
  toLabel: string;
  /** The neighbourhood each end sits in, used to resolve the label. */
  fromPlace: string;
  toPlace: string;
  progress?: number;
  className?: string;
}) {
  return (
    <LiveMap
      fromLabel={`${fromLabel}, ${fromPlace}`}
      toLabel={`${toLabel}, ${toPlace}`}
      progress={progress}
      className={className}
    />
  );
}

/**
 * The progress line under a tracking card: the line the rider has covered, the
 * dot where they are now, and the place they are going.
 */
export function RouteProgress({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-label="Route progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="relative h-[6px] rounded-full bg-surface-3"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-brand"
          style={{ width: `${pct}%` }}
        />
        <span
          className="absolute top-1/2 grid h-[16px] w-[16px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand ring-[3px] ring-surface"
          style={{ left: `${pct}%` }}
          aria-hidden="true"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        </span>
      </div>
    </div>
  );
}
