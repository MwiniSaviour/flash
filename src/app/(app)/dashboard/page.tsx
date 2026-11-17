import type { Metadata } from "next";
import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { EmptyState } from "@/components/flash/ui";
import { listBusinesses, listMyEvents, listMyKitchens } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Your business",
  description: "The kitchens you run and the events you promote.",
};

const KIND_LABEL = {
  restaurant: "Kitchen",
  events: "Events",
  driver: "Driver",
} as const;

const STATUS_LABEL = {
  approved: "Approved",
  pending: "Under review",
  declined: "Not approved",
} as const;

/**
 * The business hub.
 *
 * One place to see what the account runs and to get into each console. A
 * business that is still under review is here too — the console opens, but
 * nothing can be published until the platform approves it.
 */
export default async function DashboardPage() {
  const [businesses, kitchens, events] = await Promise.all([
    listBusinesses(),
    listMyKitchens(),
    listMyEvents(),
  ]);

  const pending = businesses.filter((business) => business.status === "pending");
  const approved = businesses.filter((business) => business.status === "approved");

  return (
    <div className="pb-8">
      <header className="px-5 pt-4">
        <p className="text-[12.5px] font-medium text-muted">Your business</p>
        <h1 className="mt-0.5 text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          {businesses.length ? "What you run" : "Run something on Flash"}
        </h1>
      </header>

      {pending.length ? (
        <section className="mt-5 px-5">
          <div className="rounded-[16px] border border-line/90 bg-surface p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-warning-soft text-warning">
                <Icon name="clock" size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[14.5px] font-bold tracking-[-0.01em] text-ink">
                  {pending[0].name}
                </p>
                <p className="text-[12.5px] text-muted">
                  {KIND_LABEL[pending[0].kind]} · {STATUS_LABEL.pending}
                </p>
              </div>
            </div>
            <p className="mt-2.5 text-[13px] leading-snug text-muted">
              Your application is with the Flash team. You can look around the console, but you
              cannot post services or take orders until it is approved.
            </p>
          </div>
        </section>
      ) : null}

      {approved.length || kitchens.length || events.length ? (
        <section className="mt-6 px-5">
          <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">Your consoles</h2>

          <ul className="mt-3 space-y-2.5">
            {kitchens.map((kitchen) => (
              <li key={kitchen.id}>
                <Link
                  href="/dashboard/restaurant"
                  className="flex items-center gap-3 rounded-[16px] border border-line/90 bg-surface p-3.5 transition hover:border-line-strong active:scale-[0.99]"
                >
                  <span className="relative block h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[12px] bg-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={kitchen.image.src}
                      alt={kitchen.image.alt}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-bold tracking-[-0.01em] text-ink">
                      {kitchen.name}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-muted">
                      Kitchen · menu, prices, offers and orders
                    </span>
                  </span>
                  <Icon name="chevron-right" size={17} className="shrink-0 text-muted-soft" />
                </Link>
              </li>
            ))}

            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href="/dashboard/events"
                  className="flex items-center gap-3 rounded-[16px] border border-line/90 bg-surface p-3.5 transition hover:border-line-strong active:scale-[0.99]"
                >
                  <span className="relative block h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[12px] bg-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.image.src}
                      alt={event.image.alt}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-bold tracking-[-0.01em] text-ink">
                      {event.title}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-muted">
                      Events · tickets, prices and sales
                    </span>
                  </span>
                  <Icon name="chevron-right" size={17} className="shrink-0 text-muted-soft" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!businesses.length && !kitchens.length && !events.length ? (
        <div className="mt-5 px-5">
          <EmptyState
            message="Run a kitchen, promote events or drive for Flash. Apply once and the console opens as soon as the team approves it."
            action="Apply to run a business"
            href="/business/apply"
          />
        </div>
      ) : null}

      {businesses.length ? (
        <section className="mt-7 px-5">
          <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">Your applications</h2>
          <ul className="mt-3 space-y-2">
            {businesses.map((business) => (
              <li
                key={business.id}
                className="flex items-center justify-between gap-3 rounded-[14px] border border-line/90 bg-surface px-3.5 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold text-ink">
                    {business.name}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-muted">
                    {KIND_LABEL[business.kind]} · {business.neighbourhood}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-[4px] text-[11.5px] font-semibold leading-none ${
                    business.status === "approved"
                      ? "bg-success-soft text-success-ink"
                      : business.status === "pending"
                        ? "bg-warning-soft text-warning"
                        : "bg-danger-soft text-danger"
                  }`}
                >
                  {STATUS_LABEL[business.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-7 px-5">
        <Link
          href="/business/apply"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-brand-ink transition-colors hover:text-brand"
        >
          Run another kind of business
          <Icon name="chevron-right" size={13} />
        </Link>
      </section>
    </div>
  );
}
