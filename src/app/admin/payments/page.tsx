import type { Metadata } from "next";

import { DataTable, DetailGrid } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/flash/ui";
import { cedis } from "@/lib/flash/format";
import { listAdminPayments, listPayouts, type AdminPayment } from "@/lib/flash/admin-repository";

export const metadata: Metadata = { title: "Payments" };

function ledgerRows(rows: AdminPayment[]) {
  return rows.map((row) => ({
    id: row.id,
    search: `${row.reference} ${row.kind} ${row.status}`,
    filterValue: row.status,
    export: [row.reference, row.kind, row.status, row.amount, row.createdAt],
    details: (
      <DetailGrid
        items={[
          { label: "Reference", value: row.reference },
          { label: "Type", value: row.kind },
          { label: "Status", value: row.status },
          { label: "Amount", value: cedis(row.amount) },
          { label: "Created", value: row.createdAt.slice(0, 16).replace("T", " ") },
        ]}
      />
    ),
    cells: [
      <span key="ref" className="font-semibold text-ink">{row.reference}</span>,
      <span key="kind">{row.kind}</span>,
      <span key="amount" className="font-semibold text-ink">{cedis(row.amount)}</span>,
      <span key="status">
        <StatusBadge
          tone={
            row.status === "success" || row.status === "paid"
              ? "success"
              : row.status === "failed"
                ? "danger"
                : "warning"
          }
          icon={row.status === "success" || row.status === "paid" ? "check" : "clock"}
        >
          {row.status}
        </StatusBadge>
      </span>,
    ],
  }));
}

const COLUMNS = [
  { label: "Reference" },
  { label: "Type" },
  { label: "Amount" },
  { label: "Status" },
];

export default async function AdminPaymentsPage() {
  const [payments, payouts] = await Promise.all([listAdminPayments(), listPayouts()]);

  return (
    <>
      <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
        Payments
      </h1>
      <p className="mt-1.5 text-[13px] text-muted">
        Every charge and payout recorded by the platform.
      </p>

      <div className="mt-6 space-y-6">
        <DataTable
          title="Charges"
          description="Payments recorded for orders and tickets."
          columns={COLUMNS}
          rows={ledgerRows(payments)}
          empty="No charges have been recorded."
        />
        <DataTable
          title="Payouts"
          description="Seller and driver settlements held until delivery is confirmed."
          columns={COLUMNS}
          rows={ledgerRows(payouts)}
          empty="No payouts have been recorded."
        />
      </div>
    </>
  );
}
