# Production smoke — ScalDive

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
- No product row points at `/assets/images/…`.

## Payments

- A paid ticket/order/ride/parcel appears in Bookings and Track after
  verification; progress and ETA appear only once a rider is assigned and the
  state is on the way, arriving or delivered.

## Rollback

- Re-deploy the previous Vercel deployment from the deployment list.
- Database changes are additive; revert the latest migration before
  re-deploying code that depends on it.
