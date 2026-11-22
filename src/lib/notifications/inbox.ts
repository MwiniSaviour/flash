import "server-only";

import { currentUserId } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { notificationHref } from "./copy";
import type { NotificationRefType } from "./types";

export type PersistedNotification = {
  id: string;
  key: string;
  title: string;
  detail: string;
  at: string;
  href: string;
  read: boolean;
  kind: string;
};

type Row = {
  id: string;
  title: string;
  body: string;
  kind: string;
  ref_type: string | null;
  ref_id: string | null;
  read_at: string | null;
  created_at: string;
};

async function rowsFor(where: "user" | "business"): Promise<Row[]> {
  const client = createAdminClient();
  if (!client) return [];
  const userId = await currentUserId();
  if (!userId) return [];
  let query = client
    .from("notifications")
    .select("id, title, body, kind, ref_type, ref_id, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50)
    .eq("user_id", userId);
  if (where === "business") query = query.not("business_id", "is", null);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Row[];
}

function toItem(row: Row): PersistedNotification {
  return {
    id: row.id,
    key: `ntf:${row.id}`,
    title: row.title,
    detail: row.body,
    at: row.created_at,
    href: notificationHref(row.ref_type as NotificationRefType | null, row.ref_id),
    read: Boolean(row.read_at),
    kind: row.kind,
  };
}

export async function getPersistedNotifications(): Promise<PersistedNotification[]> {
  return (await rowsFor("user")).map(toItem);
}

export async function getBusinessNotifications(): Promise<PersistedNotification[]> {
  return (await rowsFor("business")).map(toItem);
}

export async function listNotificationIds(): Promise<string[]> {
  const client = createAdminClient();
  if (!client) return [];
  const userId = await currentUserId();
  if (!userId) return [];
  const { data } = await client
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .is("read_at", null);
  return (data ?? []).map((row) => row.id);
}

export async function getBusinessUnreadCount(): Promise<number> {
  const client = createAdminClient();
  if (!client) return 0;
  const userId = await currentUserId();
  if (!userId) return 0;
  const { count, error } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("business_id", "is", null)
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function markPersistedRead(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const client = createAdminClient();
  if (!client) return;
  const userId = await currentUserId();
  if (!userId) return;
  const { error } = await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .in("id", ids);
  if (error) throw error;
}
