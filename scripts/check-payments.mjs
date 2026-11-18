/**
 * Checks the payment rules without contacting Paystack.
 *
 *   npm run payments:check
 */

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

const { computeCommission, DEMO_SETTINGS } = await import(
  "../src/lib/payments/commission-math.ts"
);
const { verifyWebhookSignature } = await import("../src/lib/payments/signature.ts");

// 100 cedis of food, 15 cedis delivery, Flash delivers it.
const withDelivery = computeCommission({
  itemsPesewas: 10_000,
  deliveryFeePesewas: 1_500,
  selfDelivery: false,
  settings: DEMO_SETTINGS,
});
assert.equal(withDelivery.goodsPesewas, 300);
assert.equal(withDelivery.deliveryPesewas, 45);
assert.equal(withDelivery.totalPesewas, 345);
assert.equal(withDelivery.sellerNetPesewas, 9_700);
assert.equal(withDelivery.driverPesewas, 1_500);
assert.equal(withDelivery.totalChargedPesewas, 11_500);

// Seller delivers: 4% on goods, nothing on delivery.
const selfDelivered = computeCommission({
  itemsPesewas: 10_000,
  deliveryFeePesewas: 0,
  selfDelivery: true,
  settings: DEMO_SETTINGS,
});
assert.equal(selfDelivered.goodsPesewas, 400);
assert.equal(selfDelivered.deliveryPesewas, 0);
assert.equal(selfDelivered.totalPesewas, 400);
assert.equal(selfDelivered.driverPesewas, 0);

// Rounding stays in whole pesewas, and crumbs stay with the platform.
const odd = computeCommission({
  itemsPesewas: 101,
  deliveryFeePesewas: 33,
  selfDelivery: false,
  settings: DEMO_SETTINGS,
});
assert.equal(odd.goodsPesewas, 3);
assert.equal(odd.deliveryPesewas, 1);
assert.equal(odd.totalPesewas, 4);

// The signature check uses the raw bytes and rejects a changed body.
const secret = "sk_test_example";
const body = Buffer.from('{"event":"charge.success"}');
const signature = createHmac("sha512", secret).update(body).digest("hex");
assert.equal(verifyWebhookSignature(body, signature, secret), true);
assert.equal(verifyWebhookSignature(body, signature, "other-key"), false);
assert.equal(verifyWebhookSignature(Buffer.from("{}"), signature, secret), false);
assert.equal(verifyWebhookSignature(body, undefined, secret), false);

console.log("payment checks: 14 passed");
