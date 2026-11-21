import type { Metadata } from "next";

import { AnalyticsExportButton, type AnalyticsExportRow } from "@/components/admin/AnalyticsExportButton";
import { DonutChart } from "@/components/admin/DonutChart";
import { DataTable } from "@/components/dashboard/DataTable";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { Icon } from "@/components/flash/Icon";
import { cedis } from "@/lib/flash/format";
import { getAdminOverview, listAdminBookings } from "@/lib/flash/admin-repository";

export const metadata: Metadata = { title: "Analytics" };

const SERVICE_COLORS: Record<string, string> = {
  ride: "#fc5303",
  parcel: "#d63f08",
  order: "#c33c08",
  ticket: "#7b6fae",
};

export default async function AdminAnalyticsPage() {
  const [overview, bookings] = await Promise.all([getAdminOverview(30), listAdminBookings()]);

  const totalRevenue = bookings.reduce((sum, b) => sum + b.amount, 0);
  const totalCommission = bookings.reduce((sum, b) => sum + b.commission, 0);

  // 4 KPI cards with real comparisons where a previous window exists.
  const cards = [
    {
      label: "Transactions",
      value: String(bookings.length),
      icon: "receipt" as const,
      tone: "brand" as const,
      delta: { value: `${bookings.filter((b) => b.status === "success" || b.status === "confirmed").length} paid`, direction: "up" as const },
    },
    {
      label: "Gross revenue",
      value: cedis(totalRevenue),
      icon: "banknote" as const,
      tone: "success" as const,
      delta: { value: "collected", direction: "up" as const },
    },
    {
      label: "Platform commission",
      value: cedis(totalCommission),
      icon: "wallet" as const,
      tone: "warning" as const,
      delta: { value: "3–6%", direction: "up" as const },
    },
    {
      label: "Customers",
      value: String(overview.customers),
      icon: "user" as const,
      tone: "neutral" as const,
      note: "registered",
    },
  ];

  // Daily transaction series for the bar chart (uses overview's activity buckets).
  const series = overview.series;

  // Donut: bookings by service.
  const byService = new Map<string, number>();
  for (const b of bookings) byService.set(b.kind, (byService.get(b.kind) ?? 0) + 1);
  const donutSlices = ["ride", "parcel", "order", "ticket"]
    .map((kind) => ({
      label: kind.charAt(0).toUpperCase() + kind.slice(1),
      value: byService.get(kind) ?? 0,
      color: SERVICE_COLORS[kind],
    }))
    .filter((slice) => slice.value > 0);

  // Top by service type.
  const byKind = new Map<string, { amount: number; commission: number; count: number }>();
  for (const b of bookings) {
    const cur = byKind.get(b.kind) ?? { amount: 0, commission: 0, count: 0 };
    cur.amount += b.amount;
    cur.commission += b.commission;
    cur.count += 1;
    byKind.set(b.kind, cur);
  }
  const serviceRows = [...byKind.entries()].map(([kind, v]) => ({
    id: kind,
    search: kind,
    cells: [
      <span key="kind" className="font-semibold text-ink capitalize">{kind}</span>,
      <span key="count">{v.count}</span>,
      <span key="amount" className="font-semibold text-ink">{cedis(v.amount)}</span>,
      <span key="commission">{cedis(v.commission)}</span>,
    ],
  }));

  // Top drivers by revenue.
  const byDriver = new Map<string, { amount: number; count: number }>();
  for (const b of bookings) {
    if (b.driver) {
      const cur = byDriver.get(b.driver) ?? { amount: 0, count: 0 };
      cur.amount += b.amount;
      cur.count += 1;
      byDriver.set(b.driver, cur);
    }
  }
  const driverRows = [...byDriver.entries()]
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5)
    .map(([driver, v], i) => ({
      id: driver,
      search: driver,
      cells: [
        <span key="rank" className="text-muted">{i + 1}</span>,
        <span key="driver" className="font-semibold text-ink">{driver}</span>,
        <span key="count">{v.count}</span>,
        <span key="amount" className="font-semibold text-ink">{cedis(v.amount)}</span>,
      ],
    }));

  // Top businesses by commission generated (orders + tickets carry a seller).
  const byBusiness = new Map<string, { amount: number; commission: number; count: number }>();
  for (const b of bookings) {
    if (b.kind !== "order" && b.kind !== "ticket") continue;
    // detail holds the kitchen/tier label for orders and tickets.
    const key = b.detail.split(" · ")[0] || "Kitchen";
    const cur = byBusiness.get(key) ?? { amount: 0, commission: 0, count: 0 };
    cur.amount += b.amount;
    cur.commission += b.commission;
    cur.count += 1;
    byBusiness.set(key, cur);
  }
  const businessRows = [...byBusiness.entries()]
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5)
    .map(([name, v], i) => ({
      id: name,
      search: name,
      cells: [
        <span key="rank" className="text-muted">{i + 1}</span>,
        <span key="name" className="font-semibold text-ink">{name}</span>,
        <span key="count">{v.count}</span>,
        <span key="amount" className="font-semibold text-ink">{cedis(v.amount)}</span>,
        <span key="commission">{cedis(v.commission)}</span>,
      ],
    }));

  const barMax = Math.max(1, ...series.flatMap((point) => [point.orders, point.tickets]));

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
            Analytics
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            Analyze trends, track growth, and make data-driven decisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-10 items-center gap-2 rounded-[11px] border border-line bg-surface px-3 text-[12.5px] font-semibold text-ink">
            <Icon name="calendar" size={15} /> Last 30 days
          </span>
          <AnalyticsExportButton
            rows={bookings.map<AnalyticsExportRow>((b) => ({
              reference: b.reference,
              kind: b.kind,
              status: b.status,
              amount: b.amount,
              commission: b.commission,
              customer: b.customer,
              detail: b.detail,
              createdAt: b.createdAt,
            }))}
          />
        </div>
      </div>

      <div className="mt-6">
        <KpiCards cards={cards} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[16px] border border-line/90 bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold tracking-[-0.015em] text-ink">Transaction trends</h2>
              <p className="mt-1 text-[12px] text-muted">Orders and tickets by day</p>
            </div>
          </div>
          <div className="mt-5 flex h-40 items-end gap-1.5 overflow-hidden">
            {series.map((point, index) => (
              <div key={`${point.label}-${index}`} className="flex h-full min-w-2 flex-1 flex-col justify-end">
                <div className="flex h-full items-end gap-0.5">
                  <span
                    className="flex-1 rounded-t-[3px] bg-brand-solid"
                    style={{ height: `${(point.orders / barMax) * 100}%` }}
                    title={`${point.label}: ${point.orders} orders`}
                  />
                  <span
                    className="flex-1 rounded-t-[3px] bg-brand-soft"
                    style={{ height: `${(point.tickets / barMax) * 100}%` }}
                    title={`${point.label}: ${point.tickets} tickets`}
                  />
                </div>
                {index % Math.max(1, Math.round(series.length / 6)) === 0 ? (
                  <span className="mt-1.5 truncate text-[10px] text-muted-soft">{point.label}</span>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-[11.5px] text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-solid" /> Orders</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-soft" /> Tickets</span>
          </div>
        </section>

        <section className="rounded-[16px] border border-line/90 bg-surface p-5">
          <h2 className="text-[15px] font-bold tracking-[-0.015em] text-ink">Bookings by service</h2>
          <p className="mt-1 text-[12px] text-muted">Share of each product</p>
          <div className="mt-6">
            {donutSlices.length ? (
              <DonutChart slices={donutSlices} total={bookings.length} unit="Bookings" />
            ) : (
              <p className="text-[12.5px] text-muted">No bookings recorded yet.</p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DataTable
          title="Top product / driver"
          description="Highest earners across rides and parcels."
          columns={[{ label: "#" }, { label: "Driver" }, { label: "Jobs" }, { label: "Revenue" }]}
          rows={driverRows}
          empty="No driver data."
        />
        <DataTable
          title="Top business"
          description="Highest revenue by kitchen and event."
          columns={[{ label: "#" }, { label: "Business" }, { label: "Orders" }, { label: "Revenue" }, { label: "Commission" }]}
          rows={businessRows}
          empty="No business data."
        />
      </div>

      <div className="mt-6">
        <DataTable
          title="By service type"
          description="Revenue and commission per service."
          columns={[{ label: "Service" }, { label: "Count" }, { label: "Revenue" }, { label: "Commission" }]}
          rows={serviceRows}
          empty="No bookings recorded."
        />
      </div>
    </>
  );
}
