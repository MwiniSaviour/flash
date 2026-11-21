import type { Metadata } from "next";

import { DataTable } from "@/components/dashboard/DataTable";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { cedis } from "@/lib/flash/format";
import { getAdminOverview, listAdminBookings } from "@/lib/flash/admin-repository";

export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const [overview, bookings] = await Promise.all([getAdminOverview(30), listAdminBookings()]);

  // Top performers by revenue
  const byKind = new Map<string, { amount: number; commission: number; count: number }>();
  for (const b of bookings) {
    const cur = byKind.get(b.kind) ?? { amount: 0, commission: 0, count: 0 };
    cur.amount += b.amount;
    cur.commission += b.commission;
    cur.count += 1;
    byKind.set(b.kind, cur);
  }

  const kindRows = [...byKind.entries()].map(([kind, v]) => ({
    id: kind,
    search: kind,
    filterValue: kind,
    cells: [
      <span key="kind" className="font-semibold text-ink capitalize">{kind}</span>,
      <span key="count">{v.count}</span>,
      <span key="amount" className="font-semibold text-ink">{cedis(v.amount)}</span>,
      <span key="commission" className="text-muted">{cedis(v.commission)}</span>,
    ],
  }));

  // Top drivers
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
    .map(([driver, v]) => ({
      id: driver,
      search: driver,
      cells: [
        <span key="driver" className="font-semibold text-ink">{driver}</span>,
        <span key="count">{v.count}</span>,
        <span key="amount" className="font-semibold text-ink">{cedis(v.amount)}</span>,
      ],
    }));

  // Top customers
  const byCustomer = new Map<string, { amount: number; count: number }>();
  for (const b of bookings) {
    const cur = byCustomer.get(b.customer) ?? { amount: 0, count: 0 };
    cur.amount += b.amount;
    cur.count += 1;
    byCustomer.set(b.customer, cur);
  }
  const customerRows = [...byCustomer.entries()]
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5)
    .map(([customer, v]) => ({
      id: customer,
      search: customer,
      cells: [
        <span key="customer" className="font-semibold text-ink">{customer}</span>,
        <span key="count">{v.count}</span>,
        <span key="amount" className="font-semibold text-ink">{cedis(v.amount)}</span>,
      ],
    }));

  return (
    <>
      <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.015em] text-ink">
        Analytics
      </h1>
      <p className="mt-1.5 text-[13px] text-muted">
        Transaction and commission performance over the last 30 days.
      </p>

      <div className="mt-6">
        <KpiCards
          cards={[
            { label: "Total bookings", value: String(bookings.length), icon: "receipt", tone: "brand", note: "all services" },
            { label: "Revenue", value: cedis(bookings.reduce((t, b) => t + b.amount, 0)), icon: "banknote", tone: "success", note: "gross" },
            { label: "Commission", value: cedis(bookings.reduce((t, b) => t + b.commission, 0)), icon: "wallet", tone: "warning", note: "platform" },
            { label: "Customers", value: String(overview.customers), icon: "user", tone: "neutral", note: "registered" },
          ]}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DataTable
          title="By service type"
          description="Revenue and commission per service."
          columns={[{ label: "Service" }, { label: "Count" }, { label: "Revenue" }, { label: "Commission" }]}
          rows={kindRows}
          empty="No bookings recorded."
        />
        <DataTable
          title="Top drivers"
          description="By revenue earned."
          columns={[{ label: "Driver" }, { label: "Jobs" }, { label: "Revenue" }]}
          rows={driverRows}
          empty="No driver data."
        />
      </div>

      <div className="mt-6">
        <DataTable
          title="Top customers"
          description="By spend."
          columns={[{ label: "Customer" }, { label: "Bookings" }, { label: "Spend" }]}
          rows={customerRows}
          empty="No customer data."
        />
      </div>
    </>
  );
}
