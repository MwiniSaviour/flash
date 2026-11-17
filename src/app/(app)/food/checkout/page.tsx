import type { Metadata } from "next";

import { FoodCheckout } from "@/components/food/FoodCheckout";
import { isBusinessAccount } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Your order",
};

export default async function FoodCheckoutPage() {
  const businessAccount = await isBusinessAccount();

  return <FoodCheckout businessAccount={businessAccount} />;
}
