import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { DEMO_SETTINGS, type PlatformSettings } from "./commission-math";

export { computeCommission, computeTicketCommission, DEMO_SETTINGS } from "./commission-math";
export type { Commission, CommissionInput, PlatformSettings } from "./commission-math";

/** Reads the single settings row; the demo uses the documented defaults. */
export async function platformSettings(): Promise<PlatformSettings> {
  const client = createAdminClient();
  if (!client) return DEMO_SETTINGS;

  const { data, error } = await client
    .from("platform_settings")
    .select("*")
    .eq("id", "platform")
    .maybeSingle();

  if (error) throw error;
  if (!data) return DEMO_SETTINGS;

  return {
    goodsCommissionBps: Number(data.goods_commission_bps),
    selfDeliveryGoodsCommissionBps: Number(data.self_delivery_goods_commission_bps),
    deliveryCommissionBps: Number(data.delivery_commission_bps),
    payoutHoldHours: Number(data.payout_hold_hours),
    freeEventAttendeeFeePesewas: Number(data.free_event_attendee_fee_pesewas ?? 100),
  };
}
