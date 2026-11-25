import type { Metadata } from "next";

import { FoodBrowser } from "@/components/food/FoodBrowser";
import { currentCity } from "@/lib/flash/location-server";
import { filterByCity } from "@/lib/flash/location";
import { listRestaurants } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Food",
  description: "Order food from kitchens in your city.",
};

export default async function FoodPage() {
  const city = await currentCity();
  const restaurants = filterByCity(
    await listRestaurants(),
    city,
    (restaurant) => restaurant.neighbourhood,
  );

  return <FoodBrowser restaurants={restaurants} city={city} />;
}
