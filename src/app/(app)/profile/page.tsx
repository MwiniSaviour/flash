import type { Metadata } from "next";
import Link from "next/link";

import { ProfileControl } from "@/components/auth/ProfileControl";
import { NotificationPreference } from "@/components/dashboard/NotificationInbox";
import { AccountRow } from "@/components/flash/Account";
import { Icon } from "@/components/flash/Icon";
import { getNotifications } from "@/lib/flash/notifications";
import {
  getCurrentUser,
  listBookings,
  listBusinesses,
  listTickets,
} from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Your profile",
};

export default async function ProfilePage() {
  const [user, businesses, tickets, bookings, inbox] = await Promise.all([
    getCurrentUser(),
    listBusinesses(),
    listTickets(),
    listBookings(),
    getNotifications(),
  ]);
  const business = businesses[0];

  const stats = [
    { label: "Tickets", value: tickets.reduce((total, ticket) => total + ticket.quantity, 0) },
    { label: "Rides", value: bookings.filter((booking) => booking.kind === "ride").length },
    { label: "Orders", value: bookings.filter((booking) => booking.kind === "order").length },
  ];

  return (
    <div className="pb-5">
      <h1 className="sr-only">Your profile</h1>

      <section className="flex items-center gap-4 px-5 pt-4">
        <ProfileControl user={user} size={84} className="ring-[2px] ring-white" />
        <div className="min-w-0">
          <p className="truncate text-[20px] font-bold tracking-[-0.02em] text-ink">{user.name}</p>
          <p className="mt-0.5 truncate text-[13px] text-muted">{user.email}</p>
          <div className="mt-2">
            <ProfileControl user={user} variant="button" />
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 border-y border-line/70 bg-surface/50">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center py-3.5 ${index < stats.length - 1 ? "border-r border-line/70" : ""}`}
          >
            <span className="text-[20px] font-bold tracking-[-0.02em] text-ink">{stat.value}</span>
            <span className="mt-0.5 text-[12.5px] text-muted">{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="mt-5 px-5">
        <div className="rounded-[14px] border border-line/90 bg-surface px-4">
          <AccountRow icon="ticket" label="My Tickets" href="/tickets" />
          <AccountRow icon="bookings" label="My Bookings" href="/bookings" />
          <AccountRow icon="map-pin" label="Saved places" href="/profile/saved-places" />
          <AccountRow
            icon="bell"
            label="Notifications"
            badge={inbox.unread || undefined}
            href="/profile/notifications"
          />
          <AccountRow
            icon="receipt"
            label="Transaction history"
            href="/profile/transactions"
          />
          <AccountRow icon="settings" label="Settings" href="/profile/settings" />
          <AccountRow icon="help" label="Help & Support" href="/profile/help" />
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
                      : "Your application is with the ScalDive team. You can look around the console, but you cannot post or take orders until it is approved."}
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
        <div className="rounded-[16px] border border-line/90 bg-surface p-3.5">
          <NotificationPreference enabled={user.notificationsEnabled} />
          <Link
            href="/profile/notifications"
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-brand-ink"
          >
            Open notification inbox
            <Icon name="chevron-right" size={13} />
          </Link>
        </div>
      </section>

      <footer className="mt-7 px-5 text-center text-[12.5px] leading-relaxed text-muted">
        <p>ScalDive · Accra, Ghana</p>
        <p className="mt-1">Member since {user.memberSince}</p>
      </footer>
    </div>
  );
}
