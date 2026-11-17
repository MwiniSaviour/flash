import type { Metadata } from "next";
import Link from "next/link";

import { AddDishForm } from "@/components/dashboard/AddDishForm";
import { ApprovalNotice } from "@/components/dashboard/ApprovalNotice";
import { CoverPicker } from "@/components/dashboard/CoverPicker";
import { OfferEditor } from "@/components/dashboard/OfferEditor";
import { OrderQueue } from "@/components/dashboard/OrderQueue";
import { PriceEditor } from "@/components/dashboard/PriceEditor";
import { StorefrontPoster } from "@/components/dashboard/StorefrontPoster";
import { Icon } from "@/components/flash/Icon";
import { EmptyState } from "@/components/flash/ui";
import { getEnv } from "@/lib/env";
import { listBusinesses, listIncomingOrders, listMyKitchens } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Your kitchen",
  description: "Your menu, your prices, your offers and the orders that come in.",
};

/**
 * The kitchen console.
 *
 * A kitchen manager opens this between services, so the screen answers in
 * order: what needs a decision, what you cook and what it costs, what is on
 * offer this week, and how the storefront looks.
 */
export default async function RestaurantConsolePage() {
  const [kitchens, businesses] = await Promise.all([listMyKitchens(), listBusinesses()]);
  const kitchen = kitchens[0];
  const business = businesses.find((entry) => entry.kind === "restaurant");

  if (!kitchen) {
    return (
      <div className="px-5 pt-8">
        <EmptyState
          message="No kitchen is attached to this account yet."
          action="Apply to run a kitchen"
          href="/business/apply"
        />
      </div>
    );
  }

  const orders = await listIncomingOrders(kitchen.id);
  const url = `${getEnv().siteUrl}/food/${kitchen.slug}`;

  return (
    <div className="pb-8">
      <header className="px-5 pt-4">
        <p className="text-[12.5px] font-medium text-muted">Your kitchen</p>
        <h1 className="mt-0.5 text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          {kitchen.name}
        </h1>
        <Link
          href={`/food/${kitchen.slug}`}
          className="mt-2 inline-flex items-center gap-1 text-[13.5px] font-bold text-brand-ink transition-colors hover:text-brand"
        >
          See your storefront
          <Icon name="chevron-right" size={13} />
        </Link>
      </header>

      {business ? (
        <div className="mt-5 px-5">
          <ApprovalNotice business={business} />
        </div>
      ) : null}

      <section className="mt-6 px-5">
        <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">Orders</h2>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          What came in. Accept the ones waiting for a yes, close the ones that are done.
        </p>
        <div className="mt-3">
          <OrderQueue orders={orders} />
        </div>
      </section>

      <section className="mt-7 px-5">
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
          <AddDishForm restaurantId={kitchen.id} />
        </div>
      </section>

      <section className="mt-7 px-5">
        <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">This week&rsquo;s offer</h2>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          One number, and it comes off every order.
        </p>
        <div className="mt-3">
          <OfferEditor kind="restaurant" id={kitchen.id} percent={kitchen.discount?.percent ?? 0} />
        </div>
      </section>

      <section className="mt-7 px-5">
        <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">Your storefront</h2>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          The photograph your customers see first, and the poster you print.
        </p>
        <div className="mt-3">
          <CoverPicker kitchen={kitchen} />
        </div>
        <div className="mt-5">
          <StorefrontPoster restaurant={kitchen} url={url} />
        </div>
      </section>
    </div>
  );
}
