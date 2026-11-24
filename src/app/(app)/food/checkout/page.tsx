import type { Metadata } from "next";

import { FoodCheckout } from "@/components/food/FoodCheckout";
import { isBusinessAccount } from "@/lib/flash/repository";
import { displaySettings } from "@/lib/payments/commission";

export const metadata: Metadata = {
  title: "Your order",
};

export default async function FoodCheckoutPage() {
  const [businessAccount, settings] = await Promise.all([
    isBusinessAccount(),
    displaySettings(),
  ]);

  return <FoodCheckout businessAccount={businessAccount} rates={settings} />;
}
