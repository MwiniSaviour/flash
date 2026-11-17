import type { Metadata } from "next";

import { FoodBrowser } from "@/components/food/FoodBrowser";
import { listRestaurants } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Food",
  description: "Order food from the kitchens that deliver across Accra.",
};

export default async function FoodPage() {
  const restaurants = await listRestaurants();

  return <FoodBrowser restaurants={restaurants} />;
}
