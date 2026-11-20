import type { Metadata } from "next";

import { ConsoleHeader } from "@/components/dashboard/ConsoleHeader";
import { SettlementForm } from "@/components/dashboard/SettlementForm";

export const metadata: Metadata = { title: "Payments" };

export default async function SettlementPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  return (
    <>
      <ConsoleHeader
        title="Payments"
        description="The account Flash pays your share into after a sale."
      />
      <div className="mt-5 max-w-[520px]">
        <SettlementForm businessId={businessId} />
      </div>
    </>
  );
}
