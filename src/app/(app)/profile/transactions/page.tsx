import type { Metadata } from "next";

import { DataTable } from "@/components/dashboard/DataTable";
import { DetailGrid } from "@/components/dashboard/DataTable";
import { ProfilePageHeader } from "@/components/dashboard/ProfilePageHeader";
import { StatusBadge } from "@/components/flash/ui";
import { cedis } from "@/lib/flash/format";
import { listUserPayments } from "@/lib/flash/repository";

export const metadata: Metadata = { title: "Transaction history" };

export default async function TransactionsPage() {
  const payments = await listUserPayments();

  return (
    <>
      <ProfilePageHeader
        title="Transaction history"
        subtitle="What you have paid for, and the state of each payment."
      />
      <div className="mt-5 px-5">
        <DataTable
          title="Payments"
          description="Select a row for its reference and date."
          columns={[
            { label: "Reference" },
            { label: "Method" },
            { label: "Amount" },
            { label: "Status" },
          ]}
          rows={payments.map((payment) => ({
            id: payment.id,
            search: `${payment.reference} ${payment.provider} ${payment.status}`,
            filterValue: payment.status,
            export: [
              payment.reference,
              payment.provider,
              payment.amount,
              payment.status,
              payment.createdAt,
            ],
            details: (
              <DetailGrid
                items={[
                  { label: "Reference", value: payment.reference },
                  { label: "For", value: payment.kind },
                  { label: "Method", value: payment.provider },
                  { label: "Amount", value: cedis(payment.amount) },
                  { label: "Date", value: payment.createdAt.slice(0, 16).replace("T", " ") },
                ]}
              />
            ),
            cells: [
              <span key="ref" className="font-semibold text-ink">
                {payment.reference}
              </span>,
              <span key="method">{payment.provider}</span>,
              <span key="amount" className="font-semibold text-ink">
                {cedis(payment.amount)}
              </span>,
              <span key="status">
                <StatusBadge
                  tone={
                    payment.status === "success" || payment.status === "cash"
                      ? "success"
                      : payment.status === "failed"
                        ? "danger"
                        : "warning"
                  }
                  icon={payment.status === "success" || payment.status === "cash" ? "check" : "clock"}
                >
                  {payment.status}
                </StatusBadge>
              </span>,
            ],
          }))}
          empty="No payments recorded yet. Purchases you make will appear here."
        />
      </div>
    </>
  );
}
