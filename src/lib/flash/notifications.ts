import "server-only";

import { currentUserId } from "@/lib/auth/server";
import { accountStore } from "@/lib/flash/account-store";
import { getPersistedNotifications } from "@/lib/notifications/inbox";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  getActiveOrder,
  listBusinesses,
  listTickets,
  listUserPayments,
} from "./repository";

export type AppNotification = {
  key: string;
  title: string;
  detail: string;
  at: string;
  href: string;
  read: boolean;
  kind?: string;
};

async function readKeys(userId: string | null): Promise<Set<string>> {
  const client = createAdminClient();
  if (!client) return accountStore.readKeys;

  if (!userId) return new Set<string>();
  const { data, error } = await client
    .from("notification_reads")
    .select("notification_key")
    .eq("user_id", userId);

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.notification_key));
}

/**
 * The in-app inbox.
 *
 * Nothing here is invented: every item is a real pending ticket, active order,
 * business decision or failed payment. Only the read marker is stored.
 */
export async function getNotifications(): Promise<{
  items: AppNotification[];
  unread: number;
}> {
  const userId = await currentUserId();
  const [tickets, order, businesses, payments, seen, persisted] = await Promise.all([
    listTickets(),
    getActiveOrder(),
    listBusinesses(),
    listUserPayments(),
    readKeys(userId),
    getPersistedNotifications(),
  ]);

  const items: Omit<AppNotification, "read">[] = persisted.map((item) => ({
    key: item.key,
    title: item.title,
    detail: item.detail,
    at: item.at,
    href: item.href,
    kind: item.kind,
  }));

  for (const ticket of tickets.filter((entry) => entry.status === "pending")) {
    items.push({
      key: `ticket:${ticket.id}`,
      title: "Ticket awaiting confirmation",
      detail: `${ticket.tierName} · ${ticket.quantity} ticket${ticket.quantity === 1 ? "" : "s"}`,
      at: ticket.purchasedAt,
      href: `/tickets/${ticket.id}`,
    });
  }

  if (order) {
    items.push({
      key: `order:${order.id}`,
      title: `Order #${order.number} is ${order.status}`,
      detail: `${order.lines.length} item${order.lines.length === 1 ? "" : "s"} · ${order.fulfilment}`,
      at: order.placedAt,
      href: `/orders/${order.id}`,
    });
  }

  for (const business of businesses.filter((entry) => entry.decidedAt)) {
    items.push({
      key: `business:${business.id}:${business.status}`,
      title: `${business.name} ${business.status}`,
      detail: `Your ${business.kind} application was ${business.status}.`,
      at: business.decidedAt!,
      href: "/dashboard",
    });
  }

  for (const payment of payments.filter((entry) => entry.status === "failed")) {
    items.push({
      key: `payment:${payment.id}`,
      title: "Payment failed",
      detail: `${payment.reference} · ${payment.provider}`,
      at: payment.createdAt,
      href: "/profile/transactions",
    });
  }

  const seenPersisted = new Map(persisted.map((item) => [item.key, item.read]));
  const result = items
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((item) => ({
      ...item,
      read: item.key.startsWith("ntf:")
        ? (seenPersisted.get(item.key) ?? false)
        : seen.has(item.key),
    }));

  return { items: result, unread: result.filter((item) => !item.read).length };
}
