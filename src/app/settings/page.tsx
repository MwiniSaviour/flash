import type { Metadata } from "next";

import { NotificationsSetting } from "@/components/dashboard/NotificationsSetting";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";
import { getCurrentUser } from "@/lib/flash/repository";
import { SignOutButton } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <>
      <h1 className="sr-only">Settings</h1>

      <section>
        <h2 className="text-[15px] font-bold tracking-[-0.015em] text-ink">Your account</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          How Flash knows you, and when you get alerts.
        </p>
        <ProfileEditor initial={user} />
        <NotificationsSetting enabled={user.notificationsEnabled} />
        <div className="mt-5">
          <div className="rounded-[14px] border border-line/90 bg-surface p-2">
            <SignOutButton>Sign out</SignOutButton>
          </div>
        </div>
      </section>
    </>
  );
}
