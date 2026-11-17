import type { Metadata } from "next";
import Link from "next/link";

import { AccountRow, NotificationToggle } from "@/components/flash/Account";
import { Icon } from "@/components/flash/Icon";
import { Avatar } from "@/components/flash/ui";
import { getCurrentUser, listBusinesses } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Your profile",
};

const STATS = [
  { label: "Tickets", value: "11" },
  { label: "Rides", value: "8" },
  { label: "Orders", value: "5" },
];

export default async function ProfilePage() {
  const [user, businesses] = await Promise.all([getCurrentUser(), listBusinesses()]);
  const business = businesses[0];

  return (
    <div className="pb-5">
      <h1 className="sr-only">Your profile</h1>

      <section className="flex items-center gap-4 px-5 pt-4">
        <Avatar
          src={user.avatarUrl}
          alt={`${user.name}'s profile photo`}
          name={user.name}
          size={84}
          className="ring-[2px] ring-white"
        />
        <div className="min-w-0">
          <p className="truncate text-[20px] font-bold tracking-[-0.02em] text-ink">{user.name}</p>
          <p className="mt-0.5 truncate text-[13px] text-muted">{user.email}</p>
          <Link
            href="/profile"
            className="mt-2 inline-block text-[13.5px] font-bold text-brand-ink transition-colors hover:text-brand"
          >
            Edit profile
          </Link>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 border-y border-line/70 bg-surface/50">
        {STATS.map((stat, index) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center py-3.5 ${index < STATS.length - 1 ? "border-r border-line/70" : ""}`}
          >
            <span className="text-[20px] font-bold tracking-[-0.02em] text-ink">{stat.value}</span>
            <span className="mt-0.5 text-[12.5px] text-muted">{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="mt-5 px-5">
        <div className="rounded-[14px] border border-line/90 bg-surface px-4">
          <AccountRow icon="ticket" label="My Tickets" href="/bookings" />
          <AccountRow icon="bookings" label="My Bookings" href="/bookings" />
          <AccountRow icon="map-pin" label="Saved places" href="/ride" />
          <AccountRow icon="bell" label="Notifications" badge={2} href="/profile" />
          <AccountRow icon="banknote" label="Payment methods" href="/profile" />
          <AccountRow icon="settings" label="Settings" href="/profile" />
          <AccountRow icon="help" label="Help & Support" href="/profile" />
        </div>
      </section>

      <section className="mt-5 px-5">
        <div className="rounded-[16px] border border-line/90 bg-surface p-3.5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brand-soft text-brand-ink">
              <Icon name="food" size={19} />
            </span>
            <div className="min-w-0 flex-1">
              {business ? (
                <>
                  <p className="text-[14px] font-bold tracking-[-0.01em] text-ink">
                    {business.name}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-snug text-muted">
                    {business.status === "approved"
                      ? "Your business is approved. Manage your menu, your prices and the orders that come in."
                      : "Your application is with the Flash team. You can look around the console, but you cannot post or take orders until it is approved."}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[14px] font-bold tracking-[-0.01em] text-ink">
                    Run a kitchen or promote events?
                  </p>
                  <p className="mt-1 text-[12.5px] leading-snug text-muted">
                    Apply once and your console opens: post what you sell, set your prices and take
                    the orders that come in.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={business ? "/dashboard" : "/business/apply"}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-brand-solid px-3 text-[13px] font-bold text-white transition hover:bg-brand-solid-hover"
            >
              {business ? "Open your console" : "Apply now"}
              <Icon name="arrow-right" size={14} />
            </Link>
            {business ? (
              <span
                className={`rounded-full px-2.5 py-[4px] text-[11.5px] font-semibold leading-none ${
                  business.status === "approved"
                    ? "bg-success-soft text-success-ink"
                    : business.status === "pending"
                      ? "bg-warning-soft text-warning"
                      : "bg-danger-soft text-danger"
                }`}
              >
                {business.status === "approved"
                  ? "Approved"
                  : business.status === "pending"
                    ? "Under review"
                    : "Not approved"}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-5 px-5">
        <div className="flex items-start gap-3 rounded-[16px] border border-line/90 bg-surface p-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brand-soft text-brand-ink">
            <Icon name="bell" size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold tracking-[-0.01em] text-ink">Never miss a door opening</p>
            <p className="mt-1 text-[12.5px] leading-snug text-muted">
              Get alerts for show reminders, ride arrivals and order updates.
            </p>
          </div>
          <NotificationToggle defaultOn={user.notificationsEnabled} />
        </div>
      </section>

      <footer className="mt-7 px-5 text-center text-[12.5px] leading-relaxed text-muted">
        <p>Flash · Accra, Ghana</p>
        <p className="mt-1">Member since {user.memberSince}</p>
        <p className="mt-2 text-muted-soft">
          This is an interface prototype. Events, kitchens, riders and prices are demo data.
        </p>
      </footer>
    </div>
  );
}
