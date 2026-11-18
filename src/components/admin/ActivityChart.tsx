import Link from "next/link";

const PERIODS = [7, 30, 90];

/** A compact bar chart of orders and tickets over the selected window. */
export function ActivityChart({
  series,
  days,
}: {
  series: { label: string; orders: number; tickets: number }[];
  days: number;
}) {
  const max = Math.max(1, ...series.flatMap((point) => [point.orders, point.tickets]));

  return (
    <section className="rounded-[16px] border border-line/90 bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold tracking-[-0.015em] text-ink">Activity</h2>
          <p className="mt-1 text-[12px] text-muted">Orders and tickets by day</p>
        </div>
        <div className="flex items-center gap-1 rounded-[11px] bg-surface-2 p-1">
          {PERIODS.map((period) => (
            <Link
              key={period}
              href={`/admin?days=${period}`}
              aria-current={period === days ? "page" : undefined}
              className={`rounded-[9px] px-3 py-1.5 text-[12px] font-semibold transition ${
                period === days
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgb(23_26_31/0.08)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              {period}d
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 flex h-36 items-end gap-1.5 overflow-hidden">
        {series.map((point, index) => (
          <div key={`${point.label}-${index}`} className="flex h-full min-w-2 flex-1 flex-col justify-end">
            <div className="flex h-full items-end gap-0.5">
              <span
                className="flex-1 rounded-t-[3px] bg-brand-solid"
                style={{ height: `${(point.orders / max) * 100}%` }}
                title={`${point.label}: ${point.orders} orders`}
              />
              <span
                className="flex-1 rounded-t-[3px] bg-brand-soft"
                style={{ height: `${(point.tickets / max) * 100}%` }}
                title={`${point.label}: ${point.tickets} tickets`}
              />
            </div>
            {index % Math.max(1, Math.round(series.length / 6)) === 0 ? (
              <span className="mt-1.5 truncate text-[9px] text-muted-soft">{point.label}</span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-4 text-[11.5px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-solid" /> Orders
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-soft" /> Tickets
        </span>
      </div>
    </section>
  );
}
