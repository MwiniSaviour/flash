# Production catalogue, sellers and media — design

Date: 2026-11-24
Status: approved for implementation; blocked on infrastructure credentials

## Goal

Turn Flash from a fixture-backed prototype into a production system: every
product and booking is a database row owned by a real Clerk seller, sellers can
create and manage only their own products, all images live in Cloudinary after
compression, and no screen can silently fall back to demo data.

## Current state

- `src/lib/flash/data/*` holds the product catalogue in the repository.
  `src/lib/supabase/schema.sql` mirrors `supabase/migrations/*`, but the app
  only uses Postgres when both Supabase URL and service-role key are present.
- `repository.ts` and `actions.ts` still contain no-database branches. The
  latest ones return receipts with no persisted row; a browser journal
  (`src/lib/flash/local-purchases.ts`) was added only to make those receipts
  visible locally. This journal is not a source of truth and must be removed.
- `src/lib/media/` already owns the upload boundary. `uploadImageAction` checks
  magic bytes and size, and `cloudinary.ts` applies `c_limit,w_2400,h_2400,
  q_auto:good` with webp as the incoming transformation. It has never been run
  because no Cloudinary credentials exist in any environment.
- Images still ship from `public/assets/images/` and the docs catalogue them as
  a local demo set.
- Seller-facing screens exist (`src/app/(console)/dashboard/*`,
  `src/components/dashboard/*`) but are bound to demo businesses and do not
  create products end to end against a database.

## Decisions

1. **One source of truth.** When the app starts, database configuration is
   mandatory. The fixtures and `demoStore`/`accountStore` disappear from all
   runtime paths. Tests use a seeded test database, not fixture arrays.
2. **Sellers are Clerk users, not rows invented in code.** Five seller accounts
   are created in Clerk with `public_metadata.role = "seller"`. A `sellers`
   table maps `clerk_user_id` to the seller's display details. The Clerk
   webhook keeps that row in sync on sign-up and profile changes.
3. **Every product has an owner.** `events`, `restaurants`, `menu_items`,
   `event_tiers` and `ride_classes` gain `seller_user_id` referencing
   `sellers.clerk_user_id`. Reads for storefronts are public; writes require the
   signed-in Clerk id to equal the row's owner (or an admin role).
4. **The console manages products.** The existing `DataTable` and
   `RecordDrawer` are reused for create/edit/archive of each product type.
   A seller never sees another seller's rows, including by direct id.
5. **Cloudinary is the only file store.** Postgres stores URLs and Cloudinary
   public ids, never bytes. Every upload, including the one-time migration of
   the current catalogue, goes through `src/lib/media/actions.ts` and
   `src/lib/media/cloudinary.ts`. Incoming `f_auto` is forbidden; delivery may
   add `f_auto,q_auto` and a width. Replacing an image destroys the old asset;
   a failed database write destroys the new one. Uploads are validated on magic
   bytes and limited to 8 MB, never on the declared MIME type.
6. **Customer states come from rows, not the browser.** Tickets are
   `confirmed`/`pending`; orders, rides and parcels start at
   `confirmed` or `pending delivery` and become `on the way`/`arriving`/
   `delivered`. Distance, progress and ETA are rendered only when a rider is
   assigned and the state is `on the way`, `arriving` or `delivered`.
7. **Payments remain authoritative.** No booking is confirmed before Paystack
   verification, and every write re-reads the price from the database.

## Requirements

### FR-1 — Remove demo data from runtime

- Delete the no-database branches from `repository.ts`, `actions.ts`,
  `account-store.ts`, `demo-store.ts`, `local-purchases.ts`, and the fixture
  imports in `data/*.ts` that only exist to serve the browser.
- At boot, missing database configuration is a fatal configuration error with
  an actionable message, not a silent fixture fallback.
- No screen, action or API route returns invented records.

### FR-2 — Five real sellers

- A repeatable script creates exactly five Clerk seller accounts using the
  Clerk secret key and sets `public_metadata.role = "seller"`.
- The webhook at `src/app/api/webhooks/clerk/route.ts` upserts a `sellers` row
  for every user whose role is seller.
- Seller credentials are delivered out of band and are never committed.

### FR-3 — Seller-owned, seller-managed products

- Migrations add `seller_user_id` to `events`, `restaurants`, `menu_items`,
  `event_tiers`, `ride_classes`; backfill is part of the migration, with an
  explicit owner chosen for every existing row before fixtures are deleted.
- Server actions reject a write when `currentUserId() !== row.seller_user_id`
  unless the caller has the admin role.
- Console screens list, create, edit and archive only the current seller's
  products. Delete is an archive, never a hard delete of a product with sales.

### FR-4 — Real customer records and states

- Checkout writes ticket/order/ride/parcel rows in the same transaction as the
  payment intent; verification finalises them.
- Bookings and Track read those rows through `repository.ts`. The browser
  journal is deleted.
- Status chips carry an icon and a word. Progress and ETA appear only under the
  conditions in decision 6.

### FR-5 — Production media pipeline

- `uploadImageAction` is the only write path for images, used by the console
  forms and the one-time migration script.
- Incoming transform: `c_limit,w_2400,h_2400,q_auto:good`, webp. Max 8 MB,
  magic-byte validation. No `f_auto` on upload.
- Product image columns hold Cloudinary URLs and public ids. Local files under
  `public/assets/images/` are removed from the runtime catalogue once their
  URLs are stored; `docs/assets-provenance.md` is updated to describe remote
  storage.
- Ownership checks bind a URL to its uploader before any database write.

### FR-6 — Production readiness

- Environment validation fails fast for DB, Clerk and Cloudinary.
- Migrations are idempotent and applied by the project's existing migration
  flow. `npm run db:check` remains green.
- Logs contain no secrets and no customer PII. Errors surface actionable
  messages without exposing provider responses verbatim.
- A documented smoke suite covers: sign-in as each seller, product CRUD,
  ownership denial, upload, checkout, tracking state transition, and rollback.

## Non-goals

- Changing payment providers or adding a second accent colour or typeface.
- A native mobile image cache beyond serving Cloudinary delivery URLs.
- Building a new admin role system; reuse Clerk's role metadata.

## Acceptance criteria

1. With database credentials present and the fixtures removed, all product,
   booking and tracking screens render only database rows.
2. Five Clerk seller accounts exist; each can edit and archive their own
   products and is denied on another seller's product id.
3. A new image uploaded from the console appears in Cloudinary as webp at
   ≤2400px with `q_auto:good`, and the database stores its URL/public id.
4. All existing catalogue images are in Cloudinary and no product row points
   at `/assets/images/…`.
5. A paid ticket/order/ride/parcel appears in Bookings and Track immediately
   after verification, with progress/ETA shown only once assigned and on the
   way.
6. `npm run check`, `npm run build`, `npm run db:check`, `npm run media:check`
   and the smoke suite pass on a production-like environment.

## Dependencies — hard blockers

- Database endpoint and service-role credential (Flash Supabase project, or a
  public HTTPS PostgREST endpoint for `ops/flash/` plus its JWT secret).
- Authenticated Clerk access (secret key or CLI login) to create five sellers.
- Cloudinary cloud name, API key and API secret.

Until these exist the system cannot be production-ready; no code path should
pretend otherwise.

## Risks

- Reusing another product's credentials mixes tenants and funds; each Flash
  environment must have its own database and provider keys.
- Backfilling product ownership before deleting fixtures is irreversible
  without a database backup.
- Deleting local images before verifying Cloudinary URLs breaks every screen.
- Serverless database connections need pooling; the existing `ops/flash/`
  PostgREST layer already provides it.
