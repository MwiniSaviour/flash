import "server-only";

import { createHash, createHmac } from "node:crypto";

import { getEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-owned live fingerprint.
 *
 * The browser never receives row data from this stream — only a signal that
 * the server-rendered view is stale. The fingerprint is keyed with the
 * service-role credential, which stays on the server, so it cannot be used to
 * infer row contents even if the transport is observed.
 */
type FingerprintRow = Record<string, unknown>;

function fingerprint(rows: FingerprintRow[]): string[] {
  return rows
    .map((row) =>
      Object.keys(row)
        .sort()
        .map((key) => `${key}=${String(row[key] ?? "")}`)
        .join("|"),
    )
    .sort();
}

export async function buildLiveDigest(userId: string): Promise<string> {
  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured");

  const [orders, rides, parcels, notifications] = await Promise.all([
    client
      .from("orders")
      .select("id, status, rider_id, eta_minutes, dispatch_task_status, updated_at")
      .eq("user_id", userId)
      .order("id", { ascending: true }),
    client
      .from("rides")
      .select("id, status, rider_id, eta_minutes, dispatch_task_status, updated_at")
      .eq("user_id", userId)
      .order("id", { ascending: true }),
    client
      .from("parcels")
      .select("id, status, courier_id, eta_minutes, dispatch_task_status, updated_at")
      .eq("user_id", userId)
      .order("id", { ascending: true }),
    client
      .from("notifications")
      .select("id, read_at, created_at")
      .eq("user_id", userId)
      .order("id", { ascending: true }),
  ]);

  for (const result of [orders, rides, parcels, notifications]) {
    if (result.error) throw new Error("The live state could not be read.");
  }

  const payload = JSON.stringify({
    orders: fingerprint((orders.data ?? []) as FingerprintRow[]),
    rides: fingerprint((rides.data ?? []) as FingerprintRow[]),
    parcels: fingerprint((parcels.data ?? []) as FingerprintRow[]),
    notifications: fingerprint((notifications.data ?? []) as FingerprintRow[]),
  });

  const serviceKey = getEnv().databaseServiceRoleKey;
  if (!serviceKey) throw new Error("Database is not configured");
  const key = createHash("sha256").update(`flash-live:${serviceKey}`).digest();
  return createHmac("sha256", key).update(payload).digest("hex");
}
