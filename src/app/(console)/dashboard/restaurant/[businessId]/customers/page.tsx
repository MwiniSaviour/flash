import type { Metadata } from "next";

import { CustomersTable } from "@/components/dashboard/ConsoleTables";
import { listCustomers } from "@/lib/flash/repository";

export const metadata: Metadata = { title: "Customers" };

export default async function RestaurantCustomersPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const customers = await listCustomers(businessId, "restaurant");

  return (
    <>
      <h1 className="sr-only">Customers</h1>
      <div className="mt-6">
        <CustomersTable customers={customers} />
      </div>
    </>
  );
}
