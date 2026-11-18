# Paystack payments, commissions and superadmin — design

Date: 2026-11-17
Status: approved for implementation

## Goal

Wire Flash to Paystack for orders and tickets, charge a configurable platform
commission, hold seller/driver money until delivery is confirmed, and give an
admin the controls that set those rates and approve businesses.

Pattern source: `MwiniSaviour/ecommerce` `origin/main`, the approved
2026-11-12 paystack-splits design. It deliberately chose **platform-collect +
post-fulfillment transfers** over checkout splits: refunds stay simple and
payouts can wait for delivery confirmation. That matches the requirement that
a driver is paid only after the customer confirms delivery.

Out of scope: rides and parcels (still quoted, not charged), automated payout
scheduling, and seller self-service settlement detail screens (admin sets
payout recipients in v1).

## Money model

All money is integer pesewas. The customer is never shown a service fee: they
pay items + delivery, exactly as today.

- Goods commission: 3% of the item total, or 4% when the seller delivers it
  themselves.
- Delivery commission: 3% of the delivery fee, charged only when Flash
  arranges the delivery. A seller-delivered order has no delivery fee and no
  delivery commission.
- Total platform commission = goods commission + delivery commission.
- Online: the customer pays goods + delivery to Flash's Paystack account.
  Flash holds the seller's net and the driver's fee. On customer confirmation
  of delivery, a Paystack transfer releases the driver's fee and the seller's
  net; the platform keeps the commission.
- Cash on delivery: no Paystack charge. The driver collects cash, hands it to
  the seller, and Flash records the commission as a receivable for the seller.

Rates live in one `platform_settings` row in basis points (300 / 400 / 300).
No rate is hard-coded in checkout; the admin dashboard edits them.

## Components

### `src/lib/payments/`

- `paystack.ts` — adapted from the ecommerce pattern: secret key from env,
  `transaction/initialize` (hosted checkout URL, so no public key is needed),
  `transaction/verify`, HMAC-SHA512 signature verification with timing-safe
  compare, `/bank`, `transferrecipient`, `/transfer`, refund.
- `commission.ts` — reads `platform_settings` and computes goods/delivery
  commission in pesewas; integer rounding, crumbs to the platform.
- `client.ts` (server-only) — creates payment records and increments payout
  rows inside the repository seam.

### Checkout changes

`bookTicket` and `placeOrder` accept a payment method. Cash keeps today's
flow. Online creates a `payments` row and returns a Paystack `checkoutUrl`;
the checkout screens redirect to it. Prices and ownership are still recomputed
server-side.

### Webhook

`/api/webhooks/paystack`:

1. Verify `x-paystack-signature` against the raw body.
2. Record the event id in `paystack_events` (idempotent; failed events may be
   retried).
3. On `charge.success`, verify the reference with Paystack and compare the
   amount to the stored payment before fulfilling.
4. Mark the payment successful and attach it to the order/ticket.
5. Handle `transfer.success` / `transfer.failed` for payout rows.

### Delivery confirmation and payouts

A customer action on the order/track screen confirms delivery. It stamps the
order and releases two transfers: the driver's delivery fee and the seller's
net (items minus goods commission). Transfers are recorded in `payouts` with
a status, and the webhook updates them. A driver's payout is never created
before confirmation.

### Superadmin

`profiles.role` gains `customer | business | admin`. `/admin` and its children
are gated by `requireAdmin()` on the server:

- `/admin` — overview: counts, recent payments, recent orders/tickets.
- `/admin/settings` — edit the three commission rates (basis points) and the
  payout hold window.
- `/admin/approvals` — approve or decline `businesses` applications.
- `/admin/payments` — payment and payout ledger with statuses.

The profile screen links to `/admin` for admins only.

## Schema

New migration adds `platform_settings`, `payments`, `payouts`,
`paystack_events`; `profiles.role` and settlement fields; `drivers` payout
recipient; order/ticket payment references and confirmation timestamp. All
new tables get the same RLS/grant shape as the rest of the schema.

## Verification

- `npm run check`, `build`, `db:check`, `media:check`.
- A `payments:check` script: commission arithmetic for all three cases,
  signature verification, idempotent event parsing.
- Playwright flows in keyless demo mode still pass (cash path).
- Live Paystack test-mode charge/payout requires the copied test secret; if a
  live smoke test is not possible it is reported, not assumed.
