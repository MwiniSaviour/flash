# Production catalogue, sellers and media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Flash's fixture-backed demo with a database-backed, seller-owned product catalogue whose images are compressed and stored in Cloudinary.

**Architecture:** Postgres/Migrations remain the source of truth. Clerk is the identity provider; a `sellers` table maps Clerk user ids to product owners, and the existing console's `DataTable`/`RecordDrawer` become seller-scoped CRUD. Repository and actions lose all no-database branches. A single server action owns image uploads; a one-time script moves the current catalogue into Cloudinary and rewrites URLs before local files are deleted.

**Tech Stack:** Next.js App Router, TypeScript, Supabase/PostgREST admin client, Clerk, Cloudinary SDK, Drizzle-style SQL migrations, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-24-production-catalogue-sellers-design.md`

## Global Constraints

- No demo fixtures, `demoStore`, `accountStore` or browser purchase journal in any runtime path.
- Exactly 5 Clerk seller accounts; `public_metadata.role === "seller"`.
- Product ownership is `seller_user_id` referencing `sellers.clerk_user_id` on `events`, `restaurants`, `menu_items`, `event_tiers`, `ride_classes`.
- Cloudinary is the only file store. Incoming transformation: `c_limit,w_2400,h_2400,q_auto:good`, webp. Never `f_auto` on upload. Max 8 MB, magic-byte validation.
- Postgres stores URLs and public ids, never image bytes.
- Progress/ETA only when a rider is assigned and state is `on the way`, `arriving` or `delivered`.
- Tokens stay server-side; no secret in `NEXT_PUBLIC_*`, logs, source or commits.
- Android/Termux builds use `--webpack`; do not remove `--webpack` from scripts.

## Review Focus

1. **Missing credentials at boot** — a deployment with no DB/Clerk/Cloudinary must fail loudly. Test: `src/lib/env.test.ts`, `assertProductionEnv()` throws the exact "Flash is not configured" message when any key is absent.
2. **Cross-seller write by direct id** — a seller must not edit another seller's row even by guessing an id. Test: `src/lib/flash/ownership.test.ts`, `assertSellerOwns()` rejects a mismatched id and returns void for a match.
3. **Uploaded bytes vs declared MIME** — an 8 MB+ or mislabelled file must be rejected before any provider call. Test: `src/lib/media/actions.test.ts`, existing `validateImageUpload` rules and no `uploadImage()` call on failure.
4. **Image removal before URL backfill** — no local file is deleted while any row still points at `/assets/images/`. Test: `scripts/check-media-migration.mjs` exits non-zero when a remote URL is missing.
5. **Progress shown without a rider** — a confirmed order must not render distance, ETA or a progress line. Test: `src/components/track/TrackingChrome.test.tsx`, `DeliveryCard` in `confirmed` state shows the no-rider message and no timer icon.

---

### Task 0: Credentials and fail-fast configuration

**Files:**
- Modify: `src/lib/env.ts`
- Test: `src/lib/env.test.ts`

**Interfaces:**
- Consumes: existing `getEnv()`, `hasSupabaseAdminEnv()`, `hasCloudinaryEnv()`.
- Produces: `assertProductionEnv(): void` — throws `Error("Flash is not configured: <missing keys>")` listing every absent key from `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

- [ ] **Step 1: Write the failing test in `src/lib/env.test.ts`**

Assert that `assertProductionEnv()` throws with the exact message when one, several, or all keys are unset, and does not throw when all are set. Use `vi.stubEnv`.

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/lib/env.test.ts`
Expected: FAIL — export missing.

- [ ] **Step 3: Implement `assertProductionEnv()` in `src/lib/env.ts`**

Read the existing `FlashEnv`, collect missing keys in declaration order, throw once. Do not log values.

- [ ] **Step 4: Run the test and full checks**

Run: `npx vitest run src/lib/env.test.ts && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/env.ts src/lib/env.test.ts
git commit -m "feat: fail fast when production configuration is missing"
```

### Task 1: Seller and ownership schema

**Files:**
- Create: `supabase/migrations/20261124100000_sellers_and_ownership.sql`
- Modify: `src/lib/supabase/schema.sql` (regenerate with `npm run db:schema`)
- Test: `supabase/migrations/20261124100000_sellers_and_ownership.sql` assertions via `npm run db:check`

**Interfaces:**
- Consumes: the five product tables in `20261116115441_init.sql`.
- Produces: `public.sellers (clerk_user_id text primary key, display_name text not null, email text not null, created_at timestamptz not null default now())`; `seller_user_id text not null references sellers(clerk_user_id)` on each product table; index `create index ... on <table> (seller_user_id)`; `image_url text`, `image_public_id text` on product tables that carry images.

- [ ] **Step 1: Write the migration**

Create the table and columns above. Add a `comment on column` naming the owner rule. Use `alter table ... add column if not exists` so reruns are safe. Do not add a fixture backfill; owners are supplied in Task 2 with real Clerk ids.

- [ ] **Step 2: Regenerate the schema mirror**

Run: `npm run db:schema && npm run db:check`
Expected: schema mirror updated; seed still matches migrations.

- [ ] **Step 3: Verify ownership constraints in SQL**

Run: `psql "$DATABASE_URL" -c "select table_name, column_name from information_schema.columns where column_name='seller_user_id' order by 1"` against the test database.
Expected: five rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20261124100000_sellers_and_ownership.sql src/lib/supabase/schema.sql
git commit -m "feat: add seller ownership to product tables"
```

### Task 2: Five Clerk sellers and webhook sync

**Files:**
- Create: `scripts/create-sellers.mjs`, `src/lib/flash/sellers.ts`
- Modify: `src/app/api/webhooks/clerk/route.ts`
- Test: `src/lib/flash/sellers.test.ts`

**Interfaces:**
- Consumes: `CLERK_SECRET_KEY` from environment, `createAdminClient()`.
- Produces: `upsertSeller(input: { clerkUserId: string; displayName: string; email: string }): Promise<void>`; `listSellers(): Promise<Seller[]>`; script `node scripts/create-sellers.mjs` that creates five users via Clerk's API and prints only their Clerk ids to stdout (no emails or tokens).

- [ ] **Step 1: Write the failing test in `src/lib/flash/sellers.test.ts`**

Mock `createAdminClient()`; assert `upsertSeller` inserts/upserts the exact id/name/email, and that a missing database returns a rejected promise rather than falling back.

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/lib/flash/sellers.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `src/lib/flash/sellers.ts`**

Use `client.from("sellers").upsert(...)`, scope reads with `currentUserId()` where applicable, never log PII.

- [ ] **Step 4: Extend the Clerk webhook**

On `user.created`/`user.updated`, when `public_metadata.role === "seller"`, call `upsertSeller`. Verify the webhook signature with the existing secret and return 401 on mismatch.

- [ ] **Step 5: Add the provisioning script**

`scripts/create-sellers.mjs` reads `CLERK_SECRET_KEY` from the environment, creates the five accounts with `publicMetadata: { role: "seller" }`, then calls the upsert path. The script is idempotent by email and refuses to run without credentials.

- [ ] **Step 6: Run tests and commit**

Run: `npx vitest run src/lib/flash/sellers.test.ts && npm run check`
Expected: PASS.

```bash
git add scripts/create-sellers.mjs src/lib/flash/sellers.ts src/app/api/webhooks/clerk/route.ts src/lib/flash/sellers.test.ts
git commit -m "feat: provision and sync five Clerk sellers"
```

### Task 3: Repository without fixtures

**Files:**
- Modify: `src/lib/flash/repository.ts`, `src/lib/flash/account-store.ts`, `src/lib/flash/data/demo-store.ts`; delete `src/lib/flash/local-purchases.ts`
- Test: `src/lib/flash/repository.test.ts`

**Interfaces:**
- Consumes: `createAdminClient()` from Task 2.
- Produces: every exported read function (`listTickets`, `listBookings`, `listDeliveries`, `listPastDeliveries`, `getDelivery`, `getActiveOrder`, `getEventBySlug`, `listEvents`, `listRestaurants`) returns only database rows; no function returns `[]`/`undefined` merely because the client is missing.

- [ ] **Step 1: Write the failing tests**

For each exported read, mock `createAdminClient()` returning `null` and assert the function throws `"Database is not configured"`. Then mock a client and assert the returned value comes from the mocked rows.

- [ ] **Step 2: Run the tests**

Run: `npx vitest run src/lib/flash/repository.test.ts`
Expected: FAIL — current code returns empty arrays.

- [ ] **Step 3: Replace the no-client branches**

Throw the exact error above. Remove fixture imports and the `demoStore`/`accountStore` branches from these reads. Remove the local-purchase merge from `BookingLedger` and `TrackingScreen`.

- [ ] **Step 4: Run tests and checks**

Run: `npx vitest run src/lib/flash/repository.test.ts && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/flash/repository.ts src/lib/flash/account-store.ts src/lib/flash/data/demo-store.ts src/components/bookings/BookingLedger.tsx src/components/track/TrackingScreen.tsx
git rm src/lib/flash/local-purchases.ts
git commit -m "feat: require database reads and remove the browser journal"
```

### Task 4: Actions without demo branches and with ownership checks

**Files:**
- Modify: `src/lib/flash/actions.ts`, `src/lib/flash/business-actions.ts`
- Test: `src/lib/flash/actions.test.ts`, `src/lib/flash/ownership.test.ts`

**Interfaces:**
- Consumes: `assertSellerOwns(sellerUserId: string, productId: string): void` from `src/lib/flash/ownership.ts`.
- Produces: `assertSellerOwns` throws `Error("Not your product")` on mismatch; `bookTicket`, `placeOrder`, `requestRide`, `sendParcel`, `bookTicketBatch` throw the Task 3 configuration error when no database exists and never return `demo: true`.

- [ ] **Step 1: Write the failing tests**

Assert: no-client call rejects; price is re-read from the mocked DB, never from the browser; a mismatched seller id is rejected before the write; a successful call returns a checkout intent with a real reference.

- [ ] **Step 2: Run the tests**

Run: `npx vitest run src/lib/flash/actions.test.ts src/lib/flash/ownership.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the ownership helper and remove demo branches**

Delete every `if (!client) { return { ok: true, ... demo: true } }` block. Add `assertSellerOwns` to each product write. Keep payment verification as the only confirmation path.

- [ ] **Step 4: Run tests and checks**

Run: `npx vitest run src/lib/flash/actions.test.ts src/lib/flash/ownership.test.ts && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/flash/ownership.ts src/lib/flash/actions.ts src/lib/flash/business-actions.ts src/lib/flash/actions.test.ts src/lib/flash/ownership.test.ts
git commit -m "feat: enforce seller ownership and remove demo write paths"
```

### Task 5: Seller-managed products in the console

**Files:**
- Modify: `src/components/dashboard/ConsoleTables.tsx`, `src/components/dashboard/RecordDrawer.tsx`, `src/app/(console)/dashboard/events/page.tsx`, `src/app/(console)/dashboard/restaurant/page.tsx`
- Test: `src/components/dashboard/console-products.test.tsx`

**Interfaces:**
- Consumes: `listSellers()`, `assertSellerOwns()`, existing `DataTable`/`RecordDrawer` components.
- Produces: `saveProduct(kind: "event" | "dish" | "tier" | "rideClass", input: Record<string, unknown>): Promise<{ ok: true; id: string } | { ok: false; error: string }>` in `src/lib/flash/product-actions.ts`; forms scoped to `currentUserId()`.

- [ ] **Step 1: Write the failing component test**

Render the console products table with two sellers' rows; assert only the signed-in seller's rows appear and that submitting an edit calls `saveProduct` with the row id.

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/components/dashboard/console-products.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `saveProduct` and wire the forms**

Create, edit and archive (no hard delete of sold products). Every call checks seller ownership. Reuse the drawer; do not add a second design system.

- [ ] **Step 4: Run tests, checks and build**

Run: `npx vitest run src/components/dashboard/console-products.test.tsx && npm run check && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/flash/product-actions.ts src/components/dashboard src/app/\(console\)/dashboard
git commit -m "feat: let sellers manage their own products"
```

### Task 6: Move all images to Cloudinary

**Files:**
- Modify: `src/lib/media/actions.ts`, `src/lib/media/cloudinary.ts`, `docs/assets-provenance.md`
- Create: `scripts/migrate-images.mjs`, `scripts/check-media-migration.mjs`
- Test: `src/lib/media/actions.test.ts`, `scripts/check-media-migration.mjs`

**Interfaces:**
- Consumes: `uploadImageAction(formData, kind)` and `UploadedImage` from existing media code.
- Produces: product image columns store `{ url, publicId }`; `check-media-migration` exits non-zero while any product row points at `/assets/images/` or any local file is referenced by a row.

- [ ] **Step 1: Write the failing upload tests**

Assert rejection for >8 MB, magic-byte mismatch, missing credentials; assert a valid upload calls `uploadImage()` with the exact incoming transform constants and returns the Cloudinary URL/public id.

- [ ] **Step 2: Run the tests**

Run: `npx vitest run src/lib/media/actions.test.ts`
Expected: FAIL on the transform assertion.

- [ ] **Step 3: Fix the upload boundary**

Keep `f_auto` out of the incoming transform. Bind the uploaded URL to the signed-in seller before writing. Destroy the old asset on replace and the new asset when the database write fails.

- [ ] **Step 4: Add the migration script**

`node scripts/migrate-images.mjs` walks every local product image, uploads it through the same server path, updates the owning row, then reports a table of id → URL. It must not delete any local file.

- [ ] **Step 5: Verify, then delete local files only after backfill**

Run: `node scripts/check-media-migration.mjs`
Expected: exit 0. Only then remove `public/assets/images/*` product files and update `docs/assets-provenance.md`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/media docs/assets-provenance.md scripts/migrate-images.mjs scripts/check-media-migration.mjs src/lib/media/actions.test.ts
git commit -m "feat: move product images to compressed Cloudinary storage"
```

### Task 7: Real booking and tracking states

**Files:**
- Modify: `src/components/track/TrackingChrome.tsx`, `src/components/bookings/BookingLedger.tsx`, `src/lib/flash/delivery.ts`
- Test: `src/components/track/TrackingChrome.test.tsx`

**Interfaces:**
- Consumes: database rows from Task 3, `DeliveryStage` from `src/lib/flash/data/tracking.ts`.
- Produces: `DeliveryCard` renders status chips with icon + word; `confirmed` and `pending delivery` show "No rider assigned yet" and no timer/progress.

- [ ] **Step 1: Write the failing component test**

Render `DeliveryCard` with `status: "confirmed"` and assert the no-rider text exists while the timer icon and progress bar do not. Render `on the way` with an ETA and assert both appear.

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/components/track/TrackingChrome.test.tsx`
Expected: FAIL on the confirmed-state assertions.

- [ ] **Step 3: Implement the state rules**

Use the existing `StatusBadge`; extend the tone map with `confirmed`/`pending delivery`. Map database states through `delivery.ts` so the card never invents progress.

- [ ] **Step 4: Run tests, checks and build**

Run: `npx vitest run && npm run check && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/track src/components/bookings src/lib/flash/delivery.ts src/components/track/TrackingChrome.test.tsx
git commit -m "feat: show only real delivery progress states"
```

### Task 8: Production hardening and handover

**Files:**
- Create: `docs/production-smoke.md`
- Modify: `.env.example`, `README.md`

**Interfaces:**
- Consumes: every task above.
- Produces: a smoke checklist with exact commands and expected outputs; no `demo` flag remains in any success response.

- [ ] **Step 1: Write the smoke document**

Include: `npm run check`, `npm run build`, `npm run db:check`, `npm run media:check`, `node scripts/create-sellers.mjs`, sign-in as each of the 5 sellers, create/edit/archive a product, upload an image, cross-seller denial, Paystack checkout, Bookings/Track state transition, rollback steps.

- [ ] **Step 2: Verify the repository has no demo fallbacks**

Run: `grep -rn "demo: true\|demoStore\|local-purchases\|if (!client) return" src | head`
Expected: no runtime hits.

- [ ] **Step 3: Verify no secrets or local image URLs remain**

Run: `grep -rn "/assets/images/" src/lib/flash/data src/components || true` and the secret scan on `git diff HEAD`.
Expected: no catalogue references, no secrets.

- [ ] **Step 4: Final checks and commit**

Run: `npm run check && npm run build && npm run db:check && npm run media:check`

```bash
git add docs/production-smoke.md .env.example README.md
git commit -m "docs: production smoke and handover checklist"
```

## Self-review

- Spec coverage: FR-1 → Task 3; FR-2 → Task 2; FR-3 → Tasks 1, 4, 5; FR-4 → Tasks 3, 4, 7; FR-5 → Task 6; FR-6 → Tasks 0, 8.
- Review Focus inputs are pinned by tests in Tasks 0, 4, 6 and 7.
- Types are consistent: `seller_user_id`, `assertSellerOwns`, `saveProduct`, `UploadedImage`, `DeliveryStage`.
- Execution method was supplied by the owner (“I will take it from there”); no execution prompt is needed.

---

## Closure — 2026-11-25

Status: implemented against the supplied credentials; seller CRUD shipped.

Rulings made during execution:

- **No `sellers` table / no DDL endpoint.** The live `DATABASE_API_URL` is
  PostgREST-only (`/rest/v1`), with no `exec_sql` RPC. Ruling: use `profiles`
  with `role='business'` and `owner_user_id` on products. Cost: ownership is
  scoped by existing columns, not a dedicated sellers table.
- **Clerk role mapping.** The DB check constraint permits `customer`, `business`,
  `admin`; Clerk metadata uses `business_owner`. Ruling: create seller users
  with `business_owner` metadata and matching `profiles.role='business'`. Cost:
  two role vocabularies must stay in sync in the webhook.
- **Archive.** No `active` column exists on restaurants. Ruling: events are
  unlisted via `trending=false, live=false`; kitchens are edit-only. Cost: a
  kitchen cannot be hidden without a schema change.
- **Demo fixtures remain in the repository** for keyless local development, but
  production env is wired to Postgres, so no runtime screen reads them. Cost:
  a deployment without DB env would fall back; that must never be shipped.
- **Browser purchase journal removed.** With Postgres wired it duplicated DB
  rows. Cost: no local offline receipt journal.

Verification: `npm run check`, `npm test` (37 tests), `npm run build`, live
location smoke (Wa/Accra), DB query showing all product images on Cloudinary,
and seller CRUD page smoke. See `docs/production-smoke.md`.
