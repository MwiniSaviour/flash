import type { Metadata } from "next";

import { ApprovalNotice } from "@/components/dashboard/ApprovalNotice";
import { ConsoleHeader } from "@/components/dashboard/ConsoleHeader";
import { ConsoleSectionLinks } from "@/components/dashboard/ConsoleSectionLinks";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { EmptyState } from "@/components/flash/ui";
import { cedis } from "@/lib/flash/format";
import {
  getOwnedBusiness,
  listCustomers,
  listIncomingOrders,
  listKitchen,
} from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Kitchen overview",
  description: "The numbers behind this kitchen, and where to manage each part.",
};

export default async function RestaurantOverviewPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const [business, kitchen] = await Promise.all([
    getOwnedBusiness(businessId, "restaurant"),
    listKitchen(businessId),
  ]);

  if (!business) return null;
  if (!kitchen) {
    return (
      <EmptyState
        message="This kitchen does not have a storefront yet. Finish setting it up to see its menu and orders."
        action="Back to your dashboard"
        href="/dashboard"
      />
    );
  }

  const [orders, customers] = await Promise.all([
    listIncomingOrders(kitchen.id),
    listCustomers(businessId, "restaurant"),
  ]);

  const revenue = orders.reduce((total, order) => total + order.subtotal - order.discount, 0);
  const open = orders.filter((order) => order.status !== "delivered").length;

  return (
    <>
      <ConsoleHeader title="Overview" description="Where this kitchen stands right now." />

      <KpiCards
        cards={[
          {
            label: "Open orders",
            value: String(open),
            icon: "receipt",
            tone: "warning",
            note: `${orders.length} total`,
          },
          {
            label: "Revenue",
            value: cedis(revenue),
            icon: "banknote",
            tone: "success",
            note: "from these orders",
          },
          {
            label: "Dishes",
            value: String(kitchen.menu.length),
            icon: "bowl",
            tone: "brand",
            note: "on the menu",
          },
          {
            label: "Customers",
            value: String(customers.length),
            icon: "user",
            note: "who have ordered",
          },
        ]}
      />

      <div className="mt-5">
        <ApprovalNotice business={business} />
      </div>

      <ConsoleSectionLinks kind="restaurant" businessId={businessId} />
    </>
  );
}
