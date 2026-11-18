import type { Metadata } from "next";

import { DishesTable } from "@/components/dashboard/ConsoleTables";
import { EmptyState } from "@/components/flash/ui";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { DEMO_TODAY } from "@/lib/flash/format";
import { getOwnedBusiness, listKitchen } from "@/lib/flash/repository";

export const metadata: Metadata = { title: "Dishes" };

export default async function RestaurantDishesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const [business, kitchen] = await Promise.all([
    getOwnedBusiness(businessId, "restaurant"),
    listKitchen(businessId),
  ]);

  if (!business || !kitchen) {
    return (
      <EmptyState
        message="This kitchen does not have a storefront yet."
        href="/dashboard"
        action="Back to your dashboard"
      />
    );
  }

  const today = hasSupabaseAdminEnv() ? new Date().toISOString().slice(0, 10) : DEMO_TODAY;

  return (
    <>
      <h1 className="sr-only">Dishes</h1>
      <div className="mt-6">
        <DishesTable
          businessId={business.id}
          restaurantId={kitchen.id}
          items={kitchen.menu}
          today={today}
        />
      </div>
    </>
  );
}
