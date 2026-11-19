/**
 * Checks free-event ticket math without contacting Paystack.
 *
 *   npm run events:check
 */

import assert from "node:assert/strict";

const { computeTicketCommission, DEMO_SETTINGS } = await import(
  "../src/lib/payments/commission-math.ts"
);

// A free event: the attendee pays nothing; the planner owes GHS 1 per person.
const free = computeTicketCommission({
  unitPricePesewas: 0,
  quantity: 3,
  settings: DEMO_SETTINGS,
});
assert.equal(free.amountDuePesewas, 0);
assert.equal(free.commissionPesewas, 300);

// A paid event keeps the percentage commission on the full amount.
const paid = computeTicketCommission({
  unitPricePesewas: 5000,
  quantity: 2,
  settings: DEMO_SETTINGS,
});
assert.equal(paid.amountDuePesewas, 10_000);
assert.equal(paid.commissionPesewas, 300);

// A changed flat fee is used, not a hard-coded GHS 1.
const custom = computeTicketCommission({
  unitPricePesewas: 0,
  quantity: 4,
  settings: { ...DEMO_SETTINGS, freeEventAttendeeFeePesewas: 250 },
});
assert.equal(custom.commissionPesewas, 1000);

// Zero or negative quantities never create a negative charge.
assert.equal(
  computeTicketCommission({ unitPricePesewas: 0, quantity: -2, settings: DEMO_SETTINGS })
    .commissionPesewas,
  0,
);

console.log("events checks: 5 passed");
