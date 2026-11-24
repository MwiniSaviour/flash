import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initPaystackTransaction: vi.fn(),
  newReference: vi.fn(() => "FLP-1"),
  requestTransfer: vi.fn(),
  verifyPaystackTransaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/server", () => ({ currentUserId: async () => "usr-1" }));
vi.mock("@/lib/notifications/service", () => ({
  notifyCompletion: vi.fn(),
  notifyPaymentReceived: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => null }));
vi.mock("./commission", () => ({
  computeCommission: () => ({
    goodsPesewas: 100,
    deliveryPesewas: 0,
    totalPesewas: 100,
    sellerNetPesewas: 900,
    driverPesewas: 0,
    totalChargedPesewas: 1000,
  }),
  platformSettings: async () => ({}),
}));
vi.mock("./paystack", () => ({
  paystackConfigured: () => true,
  initPaystackTransaction: mocks.initPaystackTransaction,
  newReference: mocks.newReference,
  requestTransfer: mocks.requestTransfer,
  verifyPaystackTransaction: mocks.verifyPaystackTransaction,
}));

import {
  confirmDelivery,
  fulfilPayment,
  recordCashCommission,
  releaseDriverPayoutForDispatch,
  startCheckout,
  startCommissionCheckout,
} from "./service";

const checkout = {
  kind: "order" as const,
  userId: "usr-1",
  email: "buyer@example.com",
  itemsCedis: 10,
  deliveryFeeCedis: 0,
  selfDelivery: true,
};

const writes: [string, () => Promise<unknown>][] = [
  ["startCheckout", () => startCheckout(checkout)],
  [
    "fulfilPayment",
    () =>
      fulfilPayment({
        event: "charge.success",
        data: { reference: "FLP-1", status: "success" },
      }),
  ],
  ["confirmDelivery", () => confirmDelivery({ orderId: "ord-1", userId: "usr-1" })],
  [
    "recordCashCommission",
    () =>
      recordCashCommission({
        userId: "usr-1",
        itemsCedis: 10,
        deliveryFeeCedis: 0,
        selfDelivery: true,
      }),
  ],
  ["releaseDriverPayoutForDispatch", () => releaseDriverPayoutForDispatch({ jobId: "job-1" })],
  [
    "startCommissionCheckout",
    () => startCommissionCheckout({ paymentId: "pay-1", email: "planner@example.com" }),
  ],
];

describe("payment writes without a database", () => {
  it.each(writes)("%s fails closed instead of reporting success", async (_name, write) => {
    await expect(write()).rejects.toThrow("Database is not configured");
  });

  it("does not start a Paystack charge when no ledger row can be written", async () => {
    await expect(startCheckout(checkout)).rejects.toThrow("Database is not configured");
    expect(mocks.initPaystackTransaction).not.toHaveBeenCalled();
  });
});
