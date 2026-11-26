# Seller schema and notifications — design

Date: 2026-11-25
Status: ready for implementation; blocked on direct DDL access to the ScalDive database

## Goal

Replace the remaining schema workarounds with real seller-owned product rows and
make notifications work end to end: registered device tokens, delivered FCM
messages, an inbox with read state, and links that open the right record.

## Current state

- The demo fallbacks in `repository.ts` and `actions.ts` have been removed. A
  missing database now throws `Database is not configured.`
- `DATABASE_API_URL` (`https://db-api.flash.scalmint.com`) is a PostgREST service.
  It exposes `/rest/v1` and two RPCs (`reserve_ticket`, `release_ticket`) but no
  `exec_sql` endpoint, so migrations cannot be applied through it.
- The available Supabase MCP server is bound to project ref
  `yfdytegvozhgoczcnfiz` (POS/ScalMint), not the ScalDive database. No Firebase MCP
  tool is available in this environment.
- Seller identity currently uses `profiles.role='business'` plus
  `owner_user_id` on `events` and `restaurants`. There is no `sellers` table and
  no explicit archive flag.
- Notification code exists (`src/lib/notifications/`) with web push, FCM HTTP v1
  and Resend paths, but no database token/inbox tables and no verified delivery.

## Decisions

1. **Migrations are the source of truth.** New SQL lives in
   `supabase/migrations/`; `src/lib/supabase/schema.sql` is regenerated with
   `npm run db:schema`.
2. **Sellers are first-class rows.** A `sellers` table maps Clerk user ids to
   display details and is synced from the Clerk webhook.
3. **Ownership is explicit.** Every sellable row carries `seller_user_id`
   referencing `sellers.clerk_user_id`. Child rows inherit ownership from their
   parent (menu items → restaurant, tiers → event).
4. **Archive is a flag, never a delete.** `events` and `restaurants` get
   `archived boolean not null default false`; storefront reads exclude archived
   rows. Products with sales are never hard-deleted.
5. **Notifications persist in Postgres.** Device tokens and the customer inbox
   are rows; the browser/native client never holds provider credentials. FCM
   service-account JSON stays server-side in env.
6. **No silent fallback.** If token registration, FCM or the database is not
   configured, notification calls log a clear warning and return without
   pretending a message was delivered.

## Schema work

### Sellers

- `create table public.sellers (clerk_user_id text primary key, display_name text not null, email text not null, role text not null default 'seller', created_at timestamptz not null default now(), updated_at timestamptz not null default now())`.
- Backfill from existing `profiles` rows with `role='business'`.
- Add `seller_user_id text references public.sellers(clerk_user_id)` to
  `events`, `restaurants`, `menu_items`, `event_tiers`, `ride_classes`; backfill
  from `owner_user_id` where present, then from the verified seed owners.
- Add `archived boolean not null default false` to `events` and `restaurants`.
- Update every storefront read to exclude archived rows and scope seller writes
  by `seller_user_id`.

### Notifications

- `notification_tokens (id uuid primary key default gen_random_uuid(), user_id text not null, token text not null, platform text not null check (platform in ('web','android','ios')), created_at timestamptz not null default now(), unique (user_id, token))`.
- `notifications (id uuid primary key default gen_random_uuid(), user_id text not null, kind text not null, title text not null, body text not null, href text, data jsonb not null default '{}', read_at timestamptz, created_at timestamptz not null default now())`.
- Index `notifications (user_id, created_at desc)` and
  `notification_tokens (user_id)`.
- RLS: deny anon/authenticated by default; the server uses the service role and
  scopes every query to `currentUserId()`.
- Extend the Clerk webhook to upsert `sellers` on `user.created`/`user.updated`
  when `public_metadata.role` is `business_owner`, and to delete tokens when a
  user is deleted.

## Requirements

- FR-1: Every product row has a non-null seller owner after backfill.
- FR-2: A seller can create, edit and archive only their own products; an admin
  may manage any row.
- FR-3: Archived products never appear in Events, Food, Home or Search.
- FR-4: `registerNativePush()` and `subscribeWebPush(false)` write a token row
  on success; failures are visible in logs but never crash the app.
- FR-5: `notify()` writes a notification row and sends FCM/web push where
  configured; the inbox lists rows with read/unread state.
- FR-6: Tapping a notification opens the referenced order/ticket/ride/parcel.
- FR-7: Every path is provable with an e2e smoke: register token, trigger a
  purchase notification, see it in the inbox, mark read, follow the link.

## Non-goals

- Sending email through a new provider; Resend stays as configured.
- A second push provider or a browser-held service credential.
- Changing Clerk's role vocabulary in this pass.

## Acceptance criteria

1. `npm run db:check` matches migrations and seed; no product row is unowned or
   points at a local asset path.
2. Seller login shows only their products; archive hides a product everywhere.
3. A registered device receives an FCM message for a test purchase; the inbox
   shows it as unread, then read after tap; the link opens the right record.
4. With no FCM credentials, `notify()` logs a warning and creates no fake row.

## Blockers

- Direct DDL access to the ScalDive database (Postgres connection string, or a
  Supabase MCP server configured for the ScalDive project ref) is required to apply
  the migrations.
- A Firebase MCP tool is not present in this environment. The available MCP
  server is Supabase and targets the POS project; using it would apply schema to
  the wrong database.
- FCM service-account JSON and project id must be set server-side for native
  delivery; web push needs the existing VAPID keys.

## Risks

- Backfilling ownership without a backup is irreversible.
- Applying migrations to the POS Supabase project would corrupt another tenant.
- A service-role key in a browser bundle would bypass RLS; keep it server-only.
