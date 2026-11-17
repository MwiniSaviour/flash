# Deploying Flash to Vercel

Flash is a Next.js 16 App Router app. Every service screen reads through
`src/lib/flash/repository.ts`: with no Supabase keys the app serves seeded demo
data, with keys it reads Postgres. Clerk and Cloudinary mount the same way, so a
deployment with no service keys is a fully working demo.

## What is in the repo

| File | Purpose |
|---|---|
| `vercel.json` | framework detection, `npm ci` + `npm run build`, quiet GitHub checks |
| `next.config.mjs` | headers, image optimisation, Vercel-aware settings |
| `.vercelignore` | keeps the separate Capacitor app and local artefacts out of the build |
| `.env.example` | every variable, documented |
| `supabase/migrations/` | the schema, mirrored into `src/lib/supabase/schema.sql` |

## First deployment

1. Vercel → **Add New → Project → Import Git Repository** → `MwiniSaviour/flash`.
   Framework detection must pick **Next.js**; `vercel.json` pins install and build
   commands. The build uses `--webpack` deliberately (Turbopack is unavailable on
   the Termux dev host), and it works unchanged on Vercel.
2. No environment variables are required for a demo deployment. Build and open
   the deployment: Home, Events, Ride, Food, Track and Parcel all work on the
   fixtures, with the demo customer in the header.
3. To go live, set the variables below under **Settings → Environment Variables**
   and redeploy.

## Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Production | Final origin, no trailing slash. Leave unset to use the Vercel host. |
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Browser-safe Supabase key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypasses RLS; never exposed to the browser. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | All | Clerk session provider. |
| `CLERK_SECRET_KEY` | Server only | Clerk server session. |
| `CLERK_WEBHOOK_SECRET` | Server only | Optional webhook verification. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | All | Public cloud name for uploads. |
| `CLOUDINARY_API_KEY` | Server only | Upload credential. |
| `CLOUDINARY_API_SECRET` | Server only | Upload credential. |
| `CLOUDINARY_FOLDER` | All | Defaults to `flash`. |

Every value is optional. A half-configured environment renders the fixtures and
reports the inconsistency rather than throwing (`src/lib/env.ts`).

## Database

Apply `supabase/migrations/*.sql` to the Supabase project (in filename order),
then load `supabase/seed.sql` for the demo content. The schema mirror and seed
are generated — after changing a migration or fixture run:

```bash
npm run db:schema
npm run db:seed
npm run db:check
```

`npm run db:check` proves the seed matches the migrations; it should stay green
in CI. Schema changes are additive: add a new migration instead of editing one
that a database has already run.

## Rendering and previews

- Service screens are dynamic (`force-dynamic`) so a booking made now appears on
  Bookings and Track immediately.
- The sitemap is ISR (1h). If the database is unreachable at build time it falls
  back to the static routes instead of failing the deployment.
- Preview deployments carry `X-Robots-Tag: noindex` and use their own host for
  canonical URLs when `NEXT_PUBLIC_SITE_URL` is production-only.
- `next.config.mjs` sets `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy` and HSTS on every route. The image optimizer is on on
  Vercel (native `sharp`) and off on Termux (WASM-only build).

## Local parity check

```bash
npm ci
npm run check        # typecheck + lint
npm run db:check
npm run build        # or npm run start after building
```
