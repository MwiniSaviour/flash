# Profile menu wiring — design

Date: 2026-11-19
Status: approved for implementation

## Goal

Make every row of the profile menu a working destination with real data. The
profile becomes the account's control centre: tickets, bookings, saved places,
a notification inbox and settings, payment history, account settings and help.
No self-links, no hard-coded badge, no invented preferences.

Out of scope: business receiving accounts and their dashboard monitoring;
saved card vaults; a push-notification transport (the inbox is in-app).

## Decisions

- **One route per row** under `(app)`, nested under `/profile` where it is an
  account concern. Each page inherits the customer shell and providers. The
  two booking rows become distinct: `/tickets` is the ticket index, `/bookings`
  stays the mixed ledger.
- **Payment methods becomes transaction history** at `/profile/transactions`.
  Regular customers choose a method at checkout; they do not configure one.
  The page lists the signed-in customer's real `payments` rows (amount,
  provider, status, date, reference) with an honest empty state.
- **Notifications are derived, not invented.** The inbox is built from current
  state already in the app: a pending ticket awaiting confirmation, an active
  order in progress, a business application decision, and a failed payment.
  Each links to its source screen. Read state lives in one small table,
  `notification_reads (user_id, notification_key, read_at)`, so the profile
  badge is a real unread count. The mailbox is seeded from real rows, never
  from synthetic "welcome" messages.
- **Settings owns the notification preference.** `notifications_enabled`
  already exists on `profiles`; a server action writes it. Settings also owns
  profile name/email edits (same table) and sign out. No theme, locale or
  currency settings are invented because the product has none.
- **Saved places are managed** at `/profile/saved-places` with add, rename and
  delete against the existing `saved_places` table, scoped to `currentUserId`.
  The Ride screen's saved-place chips then reflect the changes.
- **Help & Support is an honest FAQ** (tickets, rides, food, payments,
  receipts) plus a support address from `NEXT_PUBLIC_SUPPORT_EMAIL`, documented
  in `.env.example`.
- **Server-only data.** All reads go through `repository.ts`, all writes
  through `"use server"` modules returning `{ ok, error }`, using the existing
  `useTransition` + `revalidatePath` pattern. Keyless mode uses fixture
  fallbacks and process-local stores so flows stay usable without Postgres.

## Routes

- `/tickets` — ticket index (`listTickets` + `listEvents`, existing `TicketRow`).
- `/profile/saved-places` — list with add/rename/delete.
- `/profile/notifications` — derived inbox with mark-as-read.
- `/profile/transactions` — customer payment history.
- `/profile/settings` — profile edit, notification preference, sign out.
- `/profile/help` — FAQ and support contact.

## Schema

One migration: `notification_reads` with a composite primary key on
`(user_id, notification_key)`, RLS enabled, select/insert/delete granted to
service_role. `src/lib/supabase/schema.sql` and `supabase/seed.sql` are
regenerated with the repo scripts.

## Verification

`npm run check`, `npm run build`, `npm run db:check`, `npm run media:check`,
Impeccable detector on the new screens, and Playwright flows for: badge count
matches unread items, mark-as-read clears them, saved place add/delete, profile
edit persists, transaction history renders, and all seven rows reach a real
screen.
