import type { Metadata } from "next";

import { NotificationInbox } from "@/components/dashboard/NotificationInbox";
import { ConsoleTopbar } from "@/components/dashboard/ConsoleTopbar";
import { getBusinessNotifications } from "@/lib/notifications/inbox";

export const metadata: Metadata = { title: "Business notifications" };
export const dynamic = "force-dynamic";

export default async function BusinessNotificationsPage() {
  const items = await getBusinessNotifications();
  return (
    <>
      <ConsoleTopbar name="Notifications" />
      <h1 className="text-[22px] font-bold tracking-[-0.02em] text-ink">Notifications</h1>
      <p className="mt-1 text-[13px] text-muted">
        New orders and ticket sales across your businesses.
      </p>
      <NotificationInbox items={items} />
    </>
  );
}
