import type { Metadata } from "next";
import Link from "next/link";

import { AccountRow } from "@/components/flash/Account";
import { Icon } from "@/components/flash/Icon";
import { Avatar } from "@/components/flash/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getCurrentUser, listBusinesses, getSavedPlaces } from "@/lib/flash/repository";
import type { SavedPlace } from "@/lib/flash/types";
import { SignOutButton } from "@clerk/nextjs";
import { ProfileStats } from "@/components/dashboard/ProfileStats";

export const metadata: Metadata = {
  title: "Your profile",
};

export default async function ProfilePage() {
  const [user, businesses, savedPlaces] = await Promise.all([
    getCurrentUser(),
    listBusinesses(),
    getSavedPlaces(),
  ]);
  const admin = Boolean(await requireAdmin());
  const running = businesses.length > 0;

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
            href="/settings"
            className="mt-2 inline-block text-[13.5px] font-bold text-brand-ink transition-colors hover:text-brand"
          >
            Edit settings
          </Link>
        </div>
      </section>

      <ProfileStats />

      <section className="mt-5 px-5">
        <div className="rounded-[14px] border border-line/90 bg-surface px-4">
          <AccountRow icon="ticket" label="My Tickets" href="/bookings" />
          {running ? (
            <AccountRow icon="store" label="My Business" href="/dashboard" />
          ) : null}
          {savedPlaces.length > 0 ? (
            <SavedPlacesRow places={savedPlaces} />
          ) : null}
          <AccountRow icon="banknote" label="Delivery status" href="/track" />
          <AccountRow icon="settings" label="Settings" href="/settings" />
          {admin ? <AccountRow icon="dashboard" label="Admin console" href="/admin" /> : null}
        </div>
      </section>

      <section className="mt-5 px-5">
        <div className="rounded-[16px] border border-line/90 bg-surface p-3.5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brand-soft text-brand-ink">
              <Icon name="food" size={19} />
            </span>
            <div className="min-w-0 flex-1">
              {running ? (
                <>
                  <p className="text-[14px] font-bold tracking-[-0.01em] text-ink">
                    {businesses[0].name}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-snug text-muted">
                    {businesses[0].status === "approved"
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
              href={running ? "/dashboard" : "/business/apply"}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-brand-solid px-3 text-[13px] font-bold text-white transition hover:bg-brand-solid-hover"
            >
              {running ? "Open your console" : "Apply now"}
              <Icon name="arrow-right" size={14} />
            </Link>
            {running ? (
              <span
                className={`rounded-full px-2.5 py-[4px] text-[11.5px] font-semibold leading-none ${
                  businesses[0].status === "approved"
                    ? "bg-success-soft text-success-ink"
                    : "bg-warning-soft text-warning"
                }`}
              >
                {businesses[0].status === "approved" ? "Approved" : "Under review"}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-5 px-5">
        <div className="rounded-[14px] border border-line/90 bg-surface p-3.5">
          <div className="rounded-[14px] border border-line/90 bg-surface p-2">
            <SignOutButton>Sign out</SignOutButton>
          </div>
        </div>
      </section>

      <footer className="mt-8 px-5 text-center text-[12.5px] leading-relaxed text-muted">
        <p>Flash · Accra, Ghana</p>
        <p className="mt-1">Member since {user.memberSince}</p>
      </footer>
    </div>
  );
}

/** Saved places are a real list when the customer has saved any. */
function SavedPlacesRow({ places }: { places: SavedPlace[] }) {
  return (
    <div className="rounded-[14px] border-t border-line/70 pt-0.5">
      {places.map((place) => (
        <AccountRow
          key={place.id}
          icon="map-pin"
          label={place.label || place.detail || "Saved place"}
          href="/ride"
        />
      ))}
    </div>
  );
}
