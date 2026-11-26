# Deploying ScalDive to Vercel

ScalDive is a Next.js 16 App Router app. Every service screen reads through
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
| `NEXT_PUBLIC_SUPPORT_EMAIL` | All | Support address shown in Help & Support. |
| `ADMIN_HOST` | Production | Host that serves the superadmin console, e.g. `admin.flash.scalmint.com`. |
| `DATABASE_API_URL` | Server only | VPS PostgREST HTTPS endpoint, e.g. `https://db-api.flash.scalmint.com`. No Supabase cloud project. |
| `DATABASE_SERVICE_ROLE_KEY` | Server only | Signed HS256 `service_role` JWT for PostgREST; bypasses RLS. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | All | Clerk session provider. |
| `CLERK_SECRET_KEY` | Server only | Clerk server session. |
| `CLERK_WEBHOOK_SECRET` | Server only | Optional webhook verification. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | All | Public cloud name for uploads. |
| `CLOUDINARY_API_KEY` | Server only | Upload credential. |
| `CLOUDINARY_API_SECRET` | Server only | Upload credential. |
| `CLOUDINARY_FOLDER` | All | Defaults to `flash`. |

Locally every value is optional and a half-configured environment keeps the
seeded demo. In production `assertProductionEnv()` fails loudly with the missing
key names; no fixture is presented as real data.

## Superadmin subdomain

The console is served from its own host, `admin.flash.scalmint.com`, and is not
linked from the customer profile.

1. In Vercel, open the project's **Settings → Domains** and add
   `admin.flash.scalmint.com`.
2. At your DNS provider add a `CNAME` record for `admin` pointing to
   `cname.vercel-dns.com` (or the exact target Vercel shows for the domain).
3. Set `ADMIN_HOST=admin.flash.scalmint.com` on the production environment and
   redeploy.

The home route redirects that host's root to `/admin` on the server
(`src/app/(app)/page.tsx`). `src/proxy.ts` refuses any `/admin*` request on
another host in production with 404; local development and Vercel preview
deployments are exempt. The Clerk `publicMetadata.role === "admin"` check in
`requireAdmin()` still gates every admin page and action, so the subdomain alone
never grants access. Sign in at `https://admin.flash.scalmint.com/sign-in`.

If `/admin` returns 404 after signing in, the account has no admin role. Roles
live in Clerk's **public metadata** so they are visible in the Clerk Dashboard:

1. Open **Users → [the account] → Metadata → Public → Edit**.
2. Set `{ "role": "admin" }` for staff who need the console.
3. Set `{ "role": "business_owner" }` for kitchen and event owners who manage
   the console at `/dashboard` - only this role (or an administrator) can open
   it.
4. Set `{ "role": "customer" }` for everyone else - this is the default ScalDive
   assigns new accounts in the Clerk `user.created` webhook.

The three role labels are `Administrator` (`admin`), `Business owner`
(`business_owner`) and `Customer` (`customer`) (`src/lib/flash/roles.ts`). Each
appears as the `role` value on the user's Clerk Dashboard profile. Changing a
role applies to the next session token; sign out and back in if access does not
update immediately.

## Database

Flash uses the VPS Postgres/PostgREST stack in `ops/flash/`, not a Supabase cloud
project. Apply `supabase/migrations/*.sql` in filename order, then load
`supabase/seed.sql` for the demo content (see `ops/flash/deploy.sh`). The schema
mirror and seed are generated — after changing a migration or fixture run:

```bash
npm run db:schema
npm run db:seed
npm run db:check
```

`npm run db:check` proves the seed matches the migrations; it should stay green
in CI. Schema changes are additive: add a new migration instead of editing one
that a database has already run.

### Database API hostname

PostgREST binds to `127.0.0.1:3001` on the VPS. `ops/flash/nginx-db-api.conf`
exposes it at `https://db-api.flash.scalmint.com/rest/v1/` over HTTPS. The DNS A
record `db-api.flash` points at the VPS; TLS is a Let's Encrypt certificate
managed by certbot. Set `DATABASE_API_URL` to that HTTPS origin in production.

## Shared dispatch provisioning

The engine lives in the ecommerce repo's `scalmart-api` Vercel project. Flash's
`DISPATCH_API_KEY` must be registered there as
`DISPATCH_APP_KEYS=flash:<key>`; the legacy `JOBFINDER_API_KEY` alone will reject
Flash with 401. After changing that variable, redeploy `scalmart-api`.

Assignment needs at least one driver with a membership in `scalmart.driver_app_memberships`
where `app_id = 'flash'`, `status = 'approved'`, `availability = 'online'` and
`last_location_at` is recent. A stale location makes the engine report
`assignmentStatus = "no-drivers"` even though a membership exists. Driver
location is written by the driver app's location endpoint, not by the customer
app.

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
