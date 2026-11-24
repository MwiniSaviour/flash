import "server-only";

import { hasSupabaseAdminEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

import { DEMO_SETTINGS, type PlatformSettings } from "./commission-math";

export { computeCommission, computeTicketCommission, DEMO_SETTINGS } from "./commission-math";
export type { Commission, CommissionInput, PlatformSettings } from "./commission-math";

/**
 * The authoritative settings row. Commission, fares and payouts are computed
 * from these numbers, so an unconfigured database must fail instead of
 * settling at invented demo rates.
 */
export async function platformSettings(): Promise<PlatformSettings> {
  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured");

  const { data, error } = await client
    .from("platform_settings")
    .select("*")
    .eq("id", "platform")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Platform settings row is missing");

  return {
    goodsCommissionBps: Number(data.goods_commission_bps),
    selfDeliveryGoodsCommissionBps: Number(data.self_delivery_goods_commission_bps),
    deliveryCommissionBps: Number(data.delivery_commission_bps),
    payoutHoldHours: Number(data.payout_hold_hours),
    freeEventAttendeeFeePesewas: Number(data.free_event_attendee_fee_pesewas ?? 100),
    ridePerKmPesewas: Number(data.ride_per_km_pesewas ?? 100),
    parcelPerKmPesewas: Number(data.parcel_per_km_pesewas ?? 100),
    deliveryPerKmPesewas: Number(data.delivery_per_km_pesewas ?? 200),
    deliveryBaseKm: Number(data.delivery_base_km ?? 3),
  };
}

/**
 * Display-only rates for the storefront shell.
 *
 * The demo has no database, so screens that only draw a quote use the
 * documented defaults. No charge, settlement or persisted price may come from
 * this call: those paths use platformSettings() and fail closed without a DB.
 */
export async function displaySettings(): Promise<PlatformSettings> {
  if (!hasSupabaseAdminEnv()) return DEMO_SETTINGS;
  return platformSettings();
}
