"use client";

import { Icon } from "@/components/flash/Icon";

export type AnalyticsExportRow = {
  reference: string;
  kind: string;
  status: string;
  amount: number;
  commission: number;
  customer: string;
  detail: string;
  createdAt: string;
};

/** Exports the analytics bookings ledger as a CSV. */
export function AnalyticsExportButton({ rows }: { rows: AnalyticsExportRow[] }) {
  function exportCsv() {
    const columns = ["Reference", "Type", "Status", "Amount (GHS)", "Commission (GHS)", "Customer", "Detail", "Created"];
    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const lines = [columns.map(escape).join(",")];
    for (const row of rows) {
      lines.push(
        [row.reference, row.kind, row.status, row.amount, row.commission, row.customer, row.detail, row.createdAt]
          .map(escape)
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `flash-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportCsv}
      className="flex h-10 items-center gap-2 rounded-[11px] border border-line bg-surface px-3 text-[12.5px] font-semibold text-ink transition hover:border-line-strong"
    >
      <Icon name="download" size={15} />
      Export
    </button>
  );
}
