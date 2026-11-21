/**
 * A compact donut chart for a part-to-whole split.
 *
 * Built with SVG strokes so it stays crisp and needs no chart library. Each
 * segment carries a legend label and percentage; the centre shows the total.
 */
export type DonutSlice = { label: string; value: number; color: string };

export function DonutChart({ slices, total, unit = "Total" }: { slices: DonutSlice[]; total: number; unit?: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const sum = slices.reduce((acc, slice) => acc + slice.value, 0) || 1;

  // Precompute each slice's dash length and cumulative offset functionally.
  const segments = slices
    .map((slice) => ({ slice, dash: (slice.value / sum) * circumference }))
    .reduce<{ slice: DonutSlice; dash: number; offset: number }[]>((acc, item) => {
      const previous = acc[acc.length - 1];
      const offset = previous ? previous.offset + previous.dash : 0;
      acc.push({ slice: item.slice, dash: item.dash, offset });
      return acc;
    }, []);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`${unit} breakdown`}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-surface-2)" strokeWidth="16" />
        {segments.map(({ slice, dash, offset }) => (
          <circle
            key={slice.label}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth="16"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 60 60)"
          />
        ))}
        <text x="60" y="56" textAnchor="middle" className="fill-ink text-[15px] font-bold">
          {total.toLocaleString()}
        </text>
        <text x="60" y="72" textAnchor="middle" className="fill-muted text-[9px]">
          {unit}
        </text>
      </svg>
      <ul className="flex-1 space-y-2">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center justify-between gap-3 text-[12.5px]">
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
              {slice.label}
            </span>
            <span className="font-semibold text-ink">{Math.round((slice.value / sum) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
