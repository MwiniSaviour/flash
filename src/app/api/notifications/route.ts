import { NextResponse } from "next/server";

import { currentUserId } from "@/lib/auth/server";
import { getPersistedNotifications } from "@/lib/notifications/inbox";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ notifications: [], unreadCount: 0 });
  const items = await getPersistedNotifications();
  return NextResponse.json({
    notifications: items,
    unreadCount: items.filter((item) => !item.read).length,
  });
}
