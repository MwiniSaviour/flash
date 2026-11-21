import type { Metadata } from "next";

import { ReassignRideControl } from "@/components/admin/ReassignRideControl";
import { DataTable, DetailGrid } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/flash/ui";
import { cedis } from "@/lib/flash/format";
import { listAdminBookings, listDrivers } from "@/lib/flash/admin-repository";

export const metadata: Metadata = { title: "Bookings" };

const COLUMNS = [
  { label: "Reference" },
  { label: "Type" },
  { label: "Amount" },
  { label: "Commission" },
  { label: "Status" },
  { label: "" },
];

export default async function AdminBookingsPage() {
  const [bookings, drivers] = await Promise.all([listAdminBookings(), listDrivers()]);

  const rows = bookings.map((row) => ({
    id: row.id,
    search: `${row.reference} ${row.kind} ${row.status} ${row.customer} ${row.detail}`,
    filterValue: row.kind,
    export: [row.reference, row.kind, row.status, row.amount, row.commission, row.customer, row.createdAt],
    details: (
      <DetailGrid
        items={[
          { label: "Reference", value: row.reference },
          { label: "Type", value: row.kind },
          { label: "Status", value: row.status },
          { label: "Amount", value: cedis(row.amount) },
          { label: "Commission", value: cedis(row.commission) },
          { label: "Customer", value: row.customer },
          { label: "Detail", value: row.detail },
          { label: "Driver", value: row.driver ?? "Unassigned" },
          { label: "Created", value: row.createdAt.slice(0, 16).replace("T", " ") },
        ]}
      />
    ),
    cells: [
      <span key="ref" className="font-semibold text-ink">{row.reference}</span>,
      <span key="kind" className="capitalize">{row.kind}</span>,
      <span key="amount" className="font-semibold text-ink">{cedis(row.amount)}</span>,
      <span key="commission" className="text-muted">{cedis(row.commission)}</span>,
      <span key="status">
        <StatusBadge
          tone={
            row.status === "success" || row.status === "confirmed" || row.status === "delivered" || row.status === "completed"
              ? "success"
              : row.status === "failed" || row.status === "cancelled"
                ? "danger"
                : "warning"
          }
          icon={row.status === "success" || row.status === "confirmed" ? "check" : "clock"}
        >
          {row.status}
        </StatusBadge>
      </span>,
    ],
    actions:
      row.kind === "ride" && drivers.length > 0 ? (
        <ReassignRideControl rideId={row.id} currentDriver={row.driver} drivers={drivers} />
      ) : undefined,
  }));

  return (
    <>
      <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
        Bookings
      </h1>
      <p className="mt-1.5 text-[13px] text-muted">
        Every ride, parcel, order and ticket on the platform, with commission.
      </p>

      <div className="mt-6">
        <DataTable
          title="All bookings"
          description="Filter by type. Expand a row for full details."
          columns={COLUMNS}
          rows={rows}
          empty="No bookings have been recorded yet."
        />
      </div>

      {drivers.length > 0 ? (
        <p className="mt-4 text-[12px] text-muted">
          {drivers.length} driver{drivers.length === 1 ? "" : "s"} available for manual reassignment.
        </p>
      ) : null}
    </>
  );
}
