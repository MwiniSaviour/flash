import type { Metadata } from "next";

import { FoodCheckout } from "@/components/food/FoodCheckout";
import { isBusinessAccount } from "@/lib/flash/repository";
import { platformSettings } from "@/lib/payments/commission";

export const metadata: Metadata = {
  title: "Your order",
};

export default async function FoodCheckoutPage() {
  const [businessAccount, settings] = await Promise.all([
    isBusinessAccount(),
    platformSettings(),
  ]);

  return <FoodCheckout businessAccount={businessAccount} rates={settings} />;
}
