import type { Metadata } from "next";

import { ConsoleHeader } from "@/components/dashboard/ConsoleHeader";
import { CoverPicker } from "@/components/dashboard/CoverPicker";
import { StorefrontPoster } from "@/components/dashboard/StorefrontPoster";
import { EmptyState } from "@/components/flash/ui";
import { getEnv, hasCloudinaryEnv } from "@/lib/env";
import { listKitchen } from "@/lib/flash/repository";

export const metadata: Metadata = { title: "Storefront" };

export default async function RestaurantStorefrontPage({
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

  const url = `${getEnv().siteUrl}/food/${kitchen.slug}`;

  return (
    <>
      <ConsoleHeader
        title="Storefront"
        description="The photograph customers see first, and the poster you print."
      />
      <div className="mt-6">
        <CoverPicker kitchen={kitchen} canUpload={hasCloudinaryEnv()} />
      </div>
      <div className="mt-6">
        <StorefrontPoster restaurant={kitchen} url={url} />
      </div>
    </>
  );
}
