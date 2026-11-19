# Free events, ticket caps, waitlist and commission settlement — design

Date: 2026-11-19
Status: approved for implementation

## Goal

Free events must be first-class: no charge to attendees, a GHS 1.00 per-attendee
commission owed by the planner, hard ticket caps with sold-out closure, a
waitlist visible to both planner and superadmin, and a Paystack link for the
planner to settle the commission.

## Decisions

- A tier with `price = 0` is free. No extra boolean; zero is already legal in
  the schema and keeps the data model simple.
- The flat fee lives in `platform_settings.free_event_attendee_fee_pesewas`
  (default 100) and is editable by superadmin, like every other rate.
- Inventory is reserved by a Postgres RPC under a row lock: it checks
  `available >= quantity` and `sales_closed = false`, decrements `available`,
  increments `events.going`, inserts the ticket and records commission
  atomically. The current read-then-insert can oversell.
- `available = 0` closes sales; planners can add slots or explicitly reopen.
- Sold-out users submit a `ticket_requests` row, seen by the planner console
  and `/admin/requests`.
- Free bookings skip Paystack for the attendee and create a commission-due
  payment row with the planner as payer. The planner console shows the amount
  due and starts a Paystack charge for it; the webhook marks it settled.

## Schema (new migration)

- `platform_settings.free_event_attendee_fee_pesewas integer not null default 100`
  with a 0–100000 check.
- `event_tiers.sales_closed boolean not null default false`.
- `payments.payer_user_id text` (nullable, defaults to the buyer).
- `tickets.unit_price_pesewas integer not null default 0`.
- `ticket_requests` (id, event_id, tier_id, user_id, name, phone, email,
  quantity, status pending|fulfilled|declined, created_at, decided_at, note),
  with indexes on event/tier/status and the usual RLS/grants.
- RPC `reserve_ticket(p_tier_id, p_user_id, p_quantity, p_reference, ...)` that
  returns the ticket id or raises on sold-out/closed, and performs the writes
  above in one transaction.

## Behaviour

- `bookTicket`: free tier → reserve + confirm immediately + commission due;
  paid tier → reserve, then existing Paystack flow. A failed payment releases
  the reservation.
- `requestTickets`: creates a waitlist request for a sold-out tier; duplicate
  open requests per user/tier are rejected.
- Planner console: tier editor gains "tickets available" (already there) and a
  sales-closed toggle; a Requests section lists open requests; a Commission
  panel shows total due with "Pay commission".
- `startCommissionCheckout`: admin/planner-scoped server action that charges
  the planner's commission through Paystack and returns a hosted URL.
- Superadmin: settings gains the flat free-event fee; payments page shows
  due/settled; new `/admin/requests` page with status actions.
- `format.priceLabel(0)` → "Free"; event cards, detail and checkout use it.

## Verification

`npm run check`, `build`, `db:check`, `media:check`, `payments:check`; a new
`events:check` script for the free/paid commission math and cap rules;
Playwright checks that a free ticket confirms, a sold-out tier shows the
request form, and planner/admin see the request. Apply the migration to the VPS
database and regenerate the seed/schema mirror.
