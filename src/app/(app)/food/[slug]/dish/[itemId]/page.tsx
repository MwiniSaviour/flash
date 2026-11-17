import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DishOrder } from "@/components/food/DishOrder";
import { getRestaurantBySlug } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Order this dish",
};

/**
 * Ordering a dish.
 *
 * The kitchen's dish, its portions and what can be added to it. The route is
 * nested under the kitchen so the back button always returns to the menu the
 * dish came from.
 */
export default async function DishPage({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  const item = restaurant?.menu.find((entry) => entry.id === itemId);

  if (!restaurant || !item) notFound();

  return <DishOrder restaurant={restaurant} item={item} />;
}
