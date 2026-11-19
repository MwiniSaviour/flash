import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";

import { AccountSettingsForm } from "@/components/dashboard/AccountSettingsForm";
import { ProfilePageHeader } from "@/components/dashboard/ProfilePageHeader";
import { Icon } from "@/components/flash/Icon";
import { getCurrentUser } from "@/lib/flash/repository";

export const metadata: Metadata = { title: "Settings" };

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();

  return (
    <>
      <ProfilePageHeader
        title="Settings"
        subtitle="Your account details and how Flash reaches you."
      />
      <AccountSettingsForm initial={user} />

      <section className="mt-6 px-5">
        <h2 className="text-[14px] font-bold text-ink">Your account</h2>
        <Link
          href="/profile/notifications"
          className="mt-3 flex items-center gap-3 rounded-[14px] border border-line/90 bg-surface p-3.5"
        >
          <Icon name="bell" size={18} className="text-icon-idle" />
          <span className="flex-1 text-[13.5px] font-semibold text-ink">
            Notification preferences
          </span>
          <Icon name="chevron-right" size={16} className="text-muted-soft" />
        </Link>
        <Link
          href="/profile/transactions"
          className="mt-2 flex items-center gap-3 rounded-[14px] border border-line/90 bg-surface p-3.5"
        >
          <Icon name="receipt" size={18} className="text-icon-idle" />
          <span className="flex-1 text-[13.5px] font-semibold text-ink">
            Transaction history
          </span>
          <Icon name="chevron-right" size={16} className="text-muted-soft" />
        </Link>
        <div className="mt-4 rounded-[14px] border border-line/90 bg-surface p-2">
          <SignOutButton>Sign out</SignOutButton>
        </div>
      </section>
    </>
  );
}
