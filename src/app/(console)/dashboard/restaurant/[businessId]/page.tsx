import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AddDishForm } from "@/components/dashboard/AddDishForm";
import { ApprovalNotice } from "@/components/dashboard/ApprovalNotice";
import { ConsoleHeader } from "@/components/dashboard/ConsoleHeader";
import { ConsoleShell } from "@/components/dashboard/ConsoleShell";
import { CoverPicker } from "@/components/dashboard/CoverPicker";
import { OfferEditor } from "@/components/dashboard/OfferEditor";
import { OrderQueue } from "@/components/dashboard/OrderQueue";
import { PriceEditor } from "@/components/dashboard/PriceEditor";
import { StorefrontPoster } from "@/components/dashboard/StorefrontPoster";
import { EmptyState } from "@/components/flash/ui";
import { getEnv, hasCloudinaryEnv } from "@/lib/env";
import {
  getOwnedBusiness,
  listBusinesses,
  listIncomingOrders,
  listKitchen,
} from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Your kitchen",
  description: "Your menu, your prices, your offers and the orders that come in.",
};

/**
 * One kitchen's console.
 *
 * The business id in the URL is the gate: the resolver only returns a business
 * the signed-in customer owns, and every read below starts from that id. Two
 * kitchens on one account therefore see two different consoles.
 */
export default async function RestaurantConsolePage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const [business, businesses] = await Promise.all([
    getOwnedBusiness(businessId, "restaurant"),
    listBusinesses(),
  ]);

  if (!business) notFound();

  const kitchen = await listKitchen(businessId);

  if (!kitchen) {
    return (
      <ConsoleShell kind="restaurant" businesses={businesses} currentId={business.id}>
        <EmptyState
          message="This kitchen does not have a storefront yet. Finish setting it up to see its menu and orders."
          action="Back to your dashboard"
          href="/dashboard"
        />
      </ConsoleShell>
    );
  }

  const orders = await listIncomingOrders(kitchen.id);
  const url = `${getEnv().siteUrl}/food/${kitchen.slug}`;

  return (
    <ConsoleShell kind="restaurant" businesses={businesses} currentId={business.id}>
      <ConsoleHeader
        kind="restaurant"
        title={kitchen.name}
        linkHref={`/food/${kitchen.slug}`}
        linkLabel="See your storefront"
        businesses={businesses}
        currentId={business.id}
      />

      <div className="mt-5">
        <ApprovalNotice business={business} />
      </div>

      <section id="orders" className="mt-6 scroll-mt-5">
        <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">Orders</h2>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          What came in. Accept the ones waiting for a yes, close the ones that are done.
        </p>
        <div className="mt-3">
          <OrderQueue orders={orders} />
        </div>
      </section>

      <section id="menu" className="mt-7 scroll-mt-5">
        <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">What you cook</h2>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          Your menu, and what each dish costs. Change a price and it changes everywhere.
        </p>

        <ul className="mt-3 space-y-2">
          {kitchen.menu.map((item) => (
            <li key={item.id} className="rounded-[16px] border border-line/90 bg-surface p-3">
              <div className="flex items-center gap-3">
                <span className="relative block h-[44px] w-[44px] shrink-0 overflow-hidden rounded-[11px] bg-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image.src}
                    alt={item.image.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-ink">{item.name}</span>
                  <span className="mt-0.5 block truncate text-[12px] text-muted">
                    {item.description || "No description yet"}
                  </span>
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-2.5">
                <span className="text-[12px] text-muted">
                  {item.sizes.length} sizes · {item.toppings.length} extras
                </span>
                <PriceEditor id={item.id} kind="dish" price={item.price} label={item.name} />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3">
          <AddDishForm
            restaurantId={kitchen.id}
            businessId={business.id}
            canUpload={hasCloudinaryEnv()}
          />
        </div>
      </section>

      <section id="offer" className="mt-7 scroll-mt-5">
        <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">This week&rsquo;s offer</h2>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          One number, and it comes off every order.
        </p>
        <div className="mt-3">
          <OfferEditor kind="restaurant" id={kitchen.id} percent={kitchen.discount?.percent ?? 0} />
        </div>
      </section>

      <section id="storefront" className="mt-7 scroll-mt-5 pb-8">
        <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">Your storefront</h2>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          The photograph your customers see first, and the poster you print.
        </p>
        <div className="mt-3">
          <CoverPicker kitchen={kitchen} canUpload={hasCloudinaryEnv()} />
        </div>
        <div className="mt-5">
          <StorefrontPoster restaurant={kitchen} url={url} />
        </div>
      </section>
    </ConsoleShell>
  );
}
