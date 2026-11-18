import type { Metadata } from "next";

import { ActivityChart } from "@/components/admin/ActivityChart";
import { ApprovalsPanel, RecentActivityPanel } from "@/components/admin/AdminPanels";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { cedis } from "@/lib/flash/format";
import { getAdminOverview } from "@/lib/flash/admin-repository";

export const metadata: Metadata = {
  title: "Overview",
  description: "Platform-wide activity and system health.",
};

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: requested } = await searchParams;
  const parsed = Number(requested);
  const days = [7, 30, 90].includes(parsed) ? parsed : 30;
  const overview = await getAdminOverview(days);

  return (
    <>
      <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
        Overview
      </h1>
      <p className="mt-1.5 text-[13px] text-muted">
        Activity across customers, businesses and every service on the platform.
      </p>

      <KpiCards
        cards={[
          {
            label: "Customers",
            value: String(overview.customers),
            icon: "user",
            tone: "brand",
            note: "registered",
          },
          {
            label: "Businesses",
            value: String(overview.businesses),
            icon: "store",
            tone: "warning",
            note: "on the platform",
          },
          {
            label: "Booked orders",
            value: String(overview.orders),
            icon: "receipt",
            tone: "neutral",
            note: "all time",
          },
          {
            label: "Tickets sold",
            value: String(overview.tickets),
            icon: "ticket",
            tone: "success",
            note: "all time",
          },
        ]}
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <ActivityChart series={overview.series} days={days} />

          <section className="rounded-[16px] border border-line/90 bg-surface p-5">
            <h2 className="text-[15px] font-bold tracking-[-0.015em] text-ink">
              Platform value
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[12px] font-semibold text-muted">Booked value</p>
                <p className="mt-1 text-[20px] font-bold text-ink">
                  {cedis(overview.bookedValue)}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-muted">Collected</p>
                <p className="mt-1 text-[20px] font-bold text-ink">{cedis(overview.collected)}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-muted">Commission</p>
                <p className="mt-1 text-[20px] font-bold text-ink">
                  {cedis(overview.commission)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
              Booked value is the value of orders placed. Rides and parcels are quoted, not
              collected. Collected and commission come from recorded payments only.
            </p>
          </section>
        </div>

        <div className="space-y-5">
          <RecentActivityPanel activity={overview.activity} />
          <ApprovalsPanel pending={overview.pendingApprovals} />
        </div>
      </div>
    </>
  );
}
