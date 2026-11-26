# Shared smart dispatch for ScalDive and ScalMart — design

Date: 2026-11-19
Status: approved for implementation

## Goal

One dispatch engine and one driver pool serve both ScalDive and ScalMart in
production. ScalDive and ScalMart each post ride/parcel jobs to the mature engine
in the ecommerce repo; JobFinder is a prototype to be mined for good pieces,
not deployed. Ride and parcel jobs may be scheduled for the future.

## Sources reviewed

- JobFinder, local `main` 332e59c (24 ahead of origin): browser → `POST /v1/jobs`
  bridge, typed payload, local booking truth, client-only scheduling, dead mock
  driver and Prisma ride models. Its service-booking backend has the best
  scheduling validation rules.
- ScalMart, `origin/main` 315aec5: `assignment.ts`, `fulfillment.ts`,
  `routes/v1/driver.ts`, `routes/v1/jobs.ts`, `driver_app_memberships`, mature
  driver UI. Multi-tenant at the data layer but single-product at the edges.
- ScalDive: faked assignment, static status/progress tables, parcel booking exists
  but no dispatch seam and no ledger entry.

## Decisions

1. **Host the engine in the ecommerce repo.** No rewrite. ScalDive and ScalMart
   call `POST /v1/jobs` / `GET /v1/jobs/:id` through server-only clients; ScalDive
   stores the external job/task ids and a synced status snapshot locally.
2. **Tenant identity is authenticated, never defaulted.** Per-product API keys
   map to `app_id`; idempotency keys are scoped by `(app_id, key)`; driver
   sessions carry app membership. A driver busy on either app is not offered a
   second job (one pool, no double-booking).
3. **Scheduling is first-class.** `scheduled_for` column, `scheduled` and `due`
   task states, a real due-job dispatcher (cron/queue, not a poll nudge),
   reschedule/cancel with lead-time and horizon validation, and no ETA or
   "active" treatment before the window opens. Port JobFinder's *service
   booking* validation rules, not its client-only scheduling.
4. **One driver UI.** Add an app switcher and per-app apply/approval to the
   mature ScalMart driver app so the same person can be online for ScalDive and
   ScalMart. Send `appId` on location, availability and profile writes.
5. **Payments follow the platform-collect model.** ScalDive's Paystack handles
   paid rides/parcels; the engine's `delivered` event releases driver payout.
   Keyless demo mode keeps the existing fixture contract.
6. **Discard from JobFinder:** browser-exposed service key, local source of
   truth, mock driver, dead Prisma ride models, client-only scheduling. Keep
   the typed contract, geo/region helpers, fare rules and the scheduling policy.

## Work streams (independent repos)

- **A — ecommerce backend:** per-app API auth, idempotency scoping, global busy
  check, scheduling columns/states/dispatcher, driver payout ledger, remove
  hard-coded `app_id` branches in pricing/assignment.
- **B — ecommerce driver UI:** app switcher, per-app membership apply, correct
  `appId` on every write, scheduled-job display, no backend changes.
- **C — ScalDive:** `src/lib/dispatch/` server client + status adapter, migration
  for job refs/scheduling/payment, wire `requestRide`/`sendParcel`, replace
  static progress tables, extend payments and bookings ledger to rides/parcels.

## Verification

Each stream runs its own checks and reports; integration then runs ScalDive's
`npm run check`, `build`, `db:check`, `media:check`, `payments:check`, plus
backend tests in the ecommerce repo. Live cross-app dispatch smoke tests need
both engines running and are reported as unexercised otherwise.
