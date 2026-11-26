# Production smoke - Flash

Run these after any deploy. Secrets are set on the Vercel project only; never
paste values into a file, chat or commit.

## Automated

```bash
npm run check
npm run build
npm run db:check
npm run media:check
npx vitest run
```

Expected: all pass; no `demo: true` path in a successful write.

## Database API

Flash does not use a Supabase cloud project. The server talks to the VPS
PostgREST API through `DATABASE_API_URL`, set to
`https://db-api.flash.scalmint.com` in Vercel. The server-only
`DATABASE_SERVICE_ROLE_KEY` is an HS256 JWT signed with the VPS
`PGRST_JWT_SECRET`. There is no browser database credential. Alongside Clerk,
Cloudinary, Paystack and dispatch credentials, `assertProductionEnv()` fails the
production path with `Flash is not configured: <missing keys>` when any required
key is absent; no fixture is presented as real data.

## Location-sensitive catalogue

1. Sign in as a customer.
2. With a Wa position, open `/events` and `/food`: only Wa rows appear.
3. With an Accra position, only Accra rows appear.
4. Deny permission with no cached city: every available area appears.
5. `/search?q=<term>` finds rows from any city.

## Seller CRUD

1. Sign in with one of the five seller accounts (`business_owner` role).
2. Open `/dashboard/products`: only that seller's rows appear.
3. Create an event and a kitchen; verify both appear on the storefront in their city.
4. Edit both; verify the changed title/description appears.
5. Attempt an edit on another seller's id by URL or API: expect `Not your product`.
6. Unlist an event; verify it no longer appears as trending.

## Media

- New uploads go through `uploadImageAction`; confirm the Cloudinary asset is
  webp, at most 2400px and stored under `CLOUDINARY_FOLDER`.
- No product row points at `/assets/images/`.

## Payments and commissions

- A paid ticket/order/ride/parcel appears in Bookings and Track after
  verification.
- Commission is computed from database prices on the server: ticket sales,
  food orders and ride/parcel jobs each produce a payment row with the expected
  commission pesewas. The browser never supplies the commission.
- Progress and ETA appear only once a rider is assigned and the state is on the
  way, arriving or delivered.

## Smart dispatch assignment

1. Confirm `DISPATCH_APP_KEYS=flash:<key>` is set on `scalmart-api` (the legacy
   `JOBFINDER_API_KEY` alone rejects Flash with 401). Redeploy that project after
   changing the variable.
2. Confirm a fresh approved, online Flash driver membership exists; a stale
   `last_location_at` makes assignment report `no-drivers`.
3. `POST /v1/jobs` with `x-jobfinder-key` and `x-app-id`, then `GET /v1/jobs/:id`.
   The expected first state is `unassigned`; after
   `POST /v1/admin/assignment-sweep` it becomes `offered` with
   `assignmentStatus = "offered"`.
4. Flash's adapter maps `offered` to "Rider offered" and `accepted` to "Rider
   assigned" without exposing distance or ETA before a rider is assigned.
5. `POST /v1/jobs/:id/cancel` cancels the engine job and clears the offer; a
   second call is a safe no-op. The customer's Cancel control on the ride or
   parcel detail page calls it before Flash marks the local row cancelled.

## Live tracking

- `GET /api/live` returns 401 without a session and `text/event-stream` with
  `cache-control: no-store` for a signed-in user.
- A dispatch status change refreshes Track/Bookings without a manual reload.
- The stream emits only `event: refresh` with `data: {}` — never rows, emails,
  tokens or user ids.

## Security

- No secret appears in `NEXT_PUBLIC_*`, source, logs or `git diff`.
- Payment writes with no database throw `Database is not configured`; they never
  return `ok: true`.
- The service-role key is imported only through `src/lib/supabase/admin.ts`,
  guarded by `server-only`.

## Rollback

- Re-deploy the previous Vercel deployment from the deployment list.
- Database changes are additive; revert the latest migration before
  re-deploying code that depends on it.

## Remaining blockers

- Cloudinary backfill of catalogue images and deletion of local files.
- Clerk seller provisioning (five accounts and their `seller_user_id` rows).
