import { redirect } from "next/navigation";

import { consoleHref } from "@/lib/flash/console";
import { listBusinesses } from "@/lib/flash/repository";

/** Send a manager to the kitchen they run: approved first, then any. */
export default async function RestaurantConsoleIndex() {
  const businesses = await listBusinesses();
  const kitchens = businesses.filter((business) => business.kind === "restaurant");
  const chosen = kitchens.find((business) => business.status === "approved") ?? kitchens[0];

  redirect(chosen ? consoleHref("restaurant", chosen.id) : "/dashboard");
}
