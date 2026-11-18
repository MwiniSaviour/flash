import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Commission math.
 *
 * The rates live in `platform_settings` so the admin dashboard can change
 * them; nothing in checkout hard-codes a percentage. All money is integer
 * pesewas and rounding is in the platform's favour (crumbs never leave it).
 */

export type PlatformSettings = {
  goodsCommissionBps: number;
  selfDeliveryGoodsCommissionBps: number;
  deliveryCommissionBps: number;
  /** Hours a payout stays available for review before it can be released. */
  payoutHoldHours: number;
};

export const DEMO_SETTINGS: PlatformSettings = {
  goodsCommissionBps: 300,
  selfDeliveryGoodsCommissionBps: 400,
  deliveryCommissionBps: 300,
  payoutHoldHours: 48,
};

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
  };
}

export type CommissionInput = {
  /** What the customer pays for the items, in pesewas. */
  itemsPesewas: number;
  /** What the customer pays for delivery, in pesewas. */
  deliveryFeePesewas: number;
  /** A seller who delivers themselves has no delivery fee or commission. */
  selfDelivery: boolean;
  settings: PlatformSettings;
};

export type Commission = {
  goodsPesewas: number;
  deliveryPesewas: number;
  totalPesewas: number;
  /** What the seller receives after their goods commission. */
  sellerNetPesewas: number;
  /** What the driver receives; held until the customer confirms delivery. */
  driverPesewas: number;
  /** What the customer pays. */
  totalChargedPesewas: number;
};

function bps(amount: number, basisPoints: number): number {
  return Math.max(0, Math.round((amount * basisPoints) / 10_000));
}

/** Splits a payment into commission, seller net and driver payout. */
export function computeCommission(input: CommissionInput): Commission {
  const items = Math.max(0, Math.round(input.itemsPesewas));
  const delivery = Math.max(0, Math.round(input.deliveryFeePesewas));

  const goodsBps = input.selfDelivery
    ? input.settings.selfDeliveryGoodsCommissionBps
    : input.settings.goodsCommissionBps;

  const goodsPesewas = bps(items, goodsBps);
  const deliveryPesewas = input.selfDelivery ? 0 : bps(delivery, input.settings.deliveryCommissionBps);

  return {
    goodsPesewas,
    deliveryPesewas,
    totalPesewas: goodsPesewas + deliveryPesewas,
    sellerNetPesewas: items - goodsPesewas,
    driverPesewas: input.selfDelivery ? 0 : delivery,
    totalChargedPesewas: items + delivery,
  };
}
