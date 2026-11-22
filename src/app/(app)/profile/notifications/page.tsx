import type { Metadata } from "next";

import {
  NotificationInbox,
  NotificationPreference,
} from "@/components/dashboard/NotificationInbox";
import { EnablePushButton } from "@/components/flash/EnablePushButton";
import { ProfilePageHeader } from "@/components/dashboard/ProfilePageHeader";
import { getCurrentUser } from "@/lib/flash/repository";
import { getNotifications } from "@/lib/flash/notifications";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const [{ items }, user] = await Promise.all([getNotifications(), getCurrentUser()]);

  return (
    <>
      <ProfilePageHeader
        title="Notifications"
        subtitle="Things that need your attention across Flash."
      />
      <NotificationPreference enabled={user.notificationsEnabled} />
      <div className="mt-3">
        <EnablePushButton />
      </div>
      <NotificationInbox items={items} />
    </>
  );
}
