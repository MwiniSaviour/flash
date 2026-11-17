# Flash

**Tickets, rides and food in one app.** Flash is a mobile-first web client for
three urban services in Accra: booking event tickets, booking a ride, and
ordering food — with one account and one bookings ledger behind all three.

This repository holds the **UI/UX pass and its backend foundation**. Every screen
reads through a repository seam: with no keys the seam serves seeded demo
fixtures; with Supabase and Clerk configured it serves Postgres rows and real
sessions, and no screen changes shape.

```bash
npm install
npm run dev      # http://localhost:3000
npm run check    # typecheck + lint
npm run build    # production build
```

## What's in it

| Destination | What it does |
|---|---|
| **Home** | The blend. A five-slide hero of what is trending tonight (events and food), an "Up Next" rail across the services, the next event with its price, what is trending to eat, and a ride brief. |
| **Events** | Search, category chips, a featured event and the upcoming list → event page → ticket checkout → the ticket lands in your wallet. |
| **Ride** | The raised button in the middle of the bar. Where to, the active ride on a route diagram, the courier, and the class you want to book. |
| **Food** | Search, cuisine chips, and the kitchens near you and the kitchens Flash is moving most — each a card with the rating on the photograph and the delivery charge and ready time under the name. Tap a kitchen, then a dish: the portion, the extras and how many. |
| **Track** | Everything in motion: food orders, rides and parcels with their number, their stage, their ETA and their position on the map. Each card opens its own page. |
| **Send a parcel** | Flash moves things, not only people. Pick-up, drop-off, what is inside, how big it is — and a courier who quotes from those. |
| **Bookings** | The ledger — event tickets, rides and orders, filtered by service, with references and states. It lives in the profile on the phone, and in the rail on the desktop. |
| **Your kitchen** | The kitchen owner's surface: the cover their customers see, and a printable poster with a real code that opens the kitchen on a phone. |
| **Profile** | The account, the stats and the alerts. Not a tab — it lives behind the avatar. |

Every booking has **proof**: an event pass, an order receipt, a ride confirmation
and a parcel receipt each carry a real, scannable QR of the booking reference,
the details a gate, a rider or a recipient will check, and share and print
actions. The code is generated on the server from the reference itself.

On the phone the app is a native-feeling single column with a bottom tab bar.
From `lg` it re-composes into a left navigation rail, a central column and a
right rail — the social-app idiom, not a stretched phone.

## Architecture

```
src/
  app/(app)/        routes
  components/       flash/ (the design system) + one folder per surface
  lib/flash/        domain types, seeded fixtures, the repository seam
  lib/flash/        rows.ts, delivery.ts, profile.ts, actions.ts (the writes)
  lib/cart.tsx      the food cart (localStorage today, a server basket later)
  lib/supabase/     browser + server + admin clients, schema.sql for the tables
  lib/auth/         the Clerk-or-demo session provider, plus the server session
supabase/
  migrations/       the schema, as SQL — the source of truth
  seed.sql          the demo data, generated from the fixtures
scripts/            the generators and the seed/migration check
apps/mobile/        the Capacitor app, kept for the native port
```

**The seam is the point.** `src/lib/flash/repository.ts` is the only place
that knows where data comes from. It returns the fixtures when Supabase is not
configured and rows mapped from the schema when it is; the row mappers in
`src/lib/flash/rows.ts` and `src/lib/flash/delivery.ts` are the contract
between the two.

**The browser never talks to Postgres.** Every read and write goes through the
Next.js server, which holds the only credentials in the system: the service-role
client in `src/lib/supabase/admin.ts`, marked `server-only`. Row Level Security
denies `anon` and `authenticated` any row (no policies), and the repository
scopes every query to the signed-in customer.

**Files live in Cloudinary, not Postgres and not `public/`.** `src/lib/media/`
is the whole boundary: validate the bytes, upload through one signed server
action, and build delivery URLs. An incoming transformation stores a compressed
WebP master (`c_limit,w_2400,h_2400,q_auto:good`); delivery adds `f_auto,q_auto`
and responsive widths. Clerk owns profile photos; the three uploaded product
images are the kitchen cover, dish photos and event posters.

**The writes are actions.** `src/lib/flash/actions.ts` holds the four mutations
— book a ticket, place an order, request a ride, send a parcel. They re-read
the price from the database rather than trusting the browser, and they answer
from the fixtures (and say so) when no database is connected.

## The database

The schema lives in `supabase/migrations/` as ordinary SQL. Apply it with the
Supabase CLI:

```bash
npx supabase start                 # local stack (needs a working Docker)
npx supabase db reset              # applies the migrations and the seed
```

or push it to a hosted project:

```bash
npx supabase link --project-ref <ref>
npx supabase db push               # applies the migrations
psql "$DATABASE_URL" -f supabase/seed.sql
```

The seed is **generated from the demo fixtures**, so the database always holds
the same story as the app:

```bash
npm run db:seed     # regenerate supabase/seed.sql from src/lib/flash/data
npm run db:schema    # mirror every migration into src/lib/supabase/schema.sql
npm run db:check     # prove the seed still matches all the migrations
npm run media:check  # prove upload validation and delivery URL rules
```

The VPS deployment (`ops/flash/`) runs Postgres and PostgREST in two containers
and is applied with `bash /opt/flash/deploy.sh`. `ops/flash/proxy.mjs` restores
Supabase's `/rest/v1` path so the app code is identical against a hosted
project or the VPS.

```bash
cp .env.example .env.local   # optional — without the keys the app runs on demo data
```

| Variable | What it switches on |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Live data instead of fixtures |
| `SUPABASE_SERVICE_ROLE_KEY` | The server's database access. Without it the server still serves fixtures. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Real sessions instead of the demo customer |
| `CLERK_WEBHOOK_SECRET` | Verified Clerk → profile sync (`/api/webhooks/clerk`) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Photo uploads; without them the catalogue is used |

## Design system

`DESIGN.md` is the authority, with the machine-readable sidecar in
`.impeccable/design.json`. Tokens live in `src/app/globals.css` under
`@theme` and nowhere else.

The language is inherited from the reference app this was built on (a radio
station's app): warm off-white ground, one saturated broadcast orange for
anything live, near-black type, white cards with hairline borders, a
five-bar pulse mark as the only graphic. The radio subject is gone; the
language stayed. Every colour pair is checked against WCAG AA on the paper
ground, and every screen that shows a price says once, quietly, that the price
is demo data.

## Data

Every event, kitchen, rider, price and rating in this build is **synthetic**.
Venues, neighbourhoods and the cedis are real; the listings are not. The
photography is real and catalogued with its licence in
`docs/assets-provenance.md`.

The demo data is the same synthetic story in two places: the fixtures in
`src/lib/flash/data/` (which the app serves when no database is connected) and
the seed in `supabase/seed.sql` (which the database serves when one is). The
seed is generated from the fixtures, so the two cannot drift.

## Not in this build

Honest gaps, on purpose: there is **no payment provider** — the picker says so
and a new ticket is reserved, not paid. There is **no map**: the route diagram
is a diagram, the distance and duration are the demo route, and no tile is
fetched. There is **no driver assignment**: a booked ride waits for a rider,
and the rider catalogue is seeded demo data.

## License

Prototype. The photography carries unverified or Unsplash provenance, the people
are fictional, and none of it is cleared for a public launch.
