import type { Metadata } from "next";

import { OrdersTable } from "@/components/dashboard/ConsoleTables";
import { EmptyState } from "@/components/flash/ui";
import { listIncomingOrders, listKitchen } from "@/lib/flash/repository";

export const metadata: Metadata = { title: "Orders" };

export default async function RestaurantOrdersPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const kitchen = await listKitchen(businessId);

  if (!kitchen) {
    return (
      <EmptyState
        message="This kitchen does not have a storefront yet."
        href="/dashboard"
        action="Back to your dashboard"
      />
    );
  }

  const orders = await listIncomingOrders(kitchen.id);

  return (
    <>
      <h1 className="sr-only">Orders</h1>
      <div className="mt-6">
        <OrdersTable orders={orders} />
      </div>
    </>
  );
}
