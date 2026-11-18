/**
 * Commission math, with no dependencies.
 *
 * Rates are basis points and money is integer pesewas. Keeping the arithmetic
 * separate from the database makes it directly checkable.
 */

export type PlatformSettings = {
  goodsCommissionBps: number;
  selfDeliveryGoodsCommissionBps: number;
  deliveryCommissionBps: number;
  payoutHoldHours: number;
};

const settingsHost = globalThis as typeof globalThis & {
  __flashDemoSettings?: PlatformSettings;
};

export const DEMO_SETTINGS: PlatformSettings =
  settingsHost.__flashDemoSettings ??
  (settingsHost.__flashDemoSettings = {
    goodsCommissionBps: 300,
    selfDeliveryGoodsCommissionBps: 400,
    deliveryCommissionBps: 300,
    payoutHoldHours: 48,
  });

export type CommissionInput = {
  itemsPesewas: number;
  deliveryFeePesewas: number;
  selfDelivery: boolean;
  settings: PlatformSettings;
};

export type Commission = {
  goodsPesewas: number;
  deliveryPesewas: number;
  totalPesewas: number;
  sellerNetPesewas: number;
  driverPesewas: number;
  totalChargedPesewas: number;
};

function bps(amount: number, basisPoints: number): number {
  return Math.max(0, Math.round((amount * basisPoints) / 10_000));
}

/** Splits a payment into commission, seller net and held driver payout. */
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
