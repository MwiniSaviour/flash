/**
 * The route map.
 *
 * A schematic map of the route, drawn as vector: city blocks, the roads
 * between them and the route itself as a dashed brand line. It is a diagram,
 * not a satellite photograph — the reference app's map is a real tile, but a
 * fabricated one would be a lie about where anything is, and the route, the two
 * stops and the rider's position are the parts the customer needs.
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
  /** The neighbourhood each end sits in — drawn on the diagram. */
  fromPlace: string;
  toPlace: string;
  progress?: number;
  className?: string;
}) {
  // A quadratic curve from the pick-up pin to the drop-off pin.
  const p0 = { x: 44, y: 196 };
  const p1 = { x: 158, y: 46 };
  const p2 = { x: 282, y: 74 };

  const t = Math.min(1, Math.max(0, progress));
  const marker = {
    x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x,
    y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y,
  };

  return (
    <div className={`relative overflow-hidden rounded-[16px] bg-surface-2 ${className ?? ""}`}>
      <svg
        viewBox="0 0 320 224"
        className="block h-full w-full"
        role="img"
        aria-label={`Route from ${fromLabel} to ${toLabel}. The rider is ${Math.round(progress * 100)} percent of the way there.`}
      >
        {/* City blocks. */}
        <g fill="#e8e4dc">
          <rect x="14" y="18" width="86" height="46" rx="8" />
          <rect x="118" y="14" width="58" height="38" rx="8" />
          <rect x="212" y="16" width="92" height="34" rx="8" />
          <rect x="196" y="92" width="104" height="52" rx="10" />
          <rect x="18" y="96" width="54" height="44" rx="9" />
          <rect x="84" y="118" width="82" height="40" rx="9" />
          <rect x="22" y="164" width="42" height="44" rx="9" />
          <rect x="238" y="164" width="64" height="46" rx="9" />
        </g>

        {/* Roads. */}
        <g stroke="#ffffff" strokeLinecap="round" fill="none">
          <path d="M0 78h320" strokeWidth="9" />
          <path d="M96 0v224" strokeWidth="7" />
          <path d="M186 0v224" strokeWidth="5" />
          <path d="M0 152h320" strokeWidth="6" />
          <path d="M0 12h320" strokeWidth="4" />
        </g>

        {/* District labels — the two neighbourhoods this route crosses, so the
            diagram says where it is rather than showing a fixed place. */}
        <g fill="#8d867d" fontSize="9" fontWeight="600" letterSpacing="1.4">
          <text x="16" y="112">{fromPlace.toUpperCase()}</text>
          <text x="200" y="158">{toPlace.toUpperCase()}</text>
        </g>

        {/* The route. */}
        <path
          d={`M${p0.x} ${p0.y} Q${p1.x} ${p1.y} ${p2.x} ${p2.y}`}
          fill="none"
          stroke="#fc5303"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="7 7"
        />

        {/* Pick-up. */}
        <circle cx={p0.x} cy={p0.y} r="8" fill="#fc5303" />
        <circle cx={p0.x} cy={p0.y} r="3" fill="#ffffff" />

        {/* Drop-off. */}
        <circle cx={p2.x} cy={p2.y} r="8.5" fill="#ffffff" stroke="#fc5303" strokeWidth="3" />
        <circle cx={p2.x} cy={p2.y} r="2.5" fill="#fc5303" />

        {/* Where the rider is right now. */}
        <circle cx={marker.x} cy={marker.y} r="11" fill="#fc5303" opacity="0.18" />
        <circle cx={marker.x} cy={marker.y} r="6.5" fill="#fc5303" />
        <circle cx={marker.x} cy={marker.y} r="2.4" fill="#ffffff" />
      </svg>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
        <span className="rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-[0_2px_8px_rgb(23_26_31/0.12)]">
          {fromLabel}
        </span>
        <span className="rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-[0_2px_8px_rgb(23_26_31/0.12)]">
          {toLabel}
        </span>
      </div>
    </div>
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
      <div className="relative h-[6px] rounded-full bg-surface-3">
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
