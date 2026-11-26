# AGENTS.md — ScalDive

Read this before running anything. It exists because the platform constraints and
the design rules are both easy to break by accident.

## 1. What this is

**ScalDive** — one app for three urban services in Accra: event tickets, rides and
food.

The interface is complete, and the backend is wired behind a seam: every screen
reads through `src/lib/flash/repository.ts`, which serves seeded fixtures when
no keys are present and Postgres rows when they are. Clerk is mounted the same
way — the real session replaces the demo customer when
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is present, and nothing downstream changes.

```
src/
  app/(app)/        routes: / /events /food /ride /track /bookings /profile /search
  components/       flash/ (design system) + one folder per surface
  lib/flash/        types, fixtures, format helpers, the repository seam
  lib/flash/        rows.ts (row shapes), delivery.ts (mappers), profile.ts,
                    actions.ts (the four writes)
  lib/cart.tsx      the food cart (localStorage today, a server basket later)
  lib/supabase/     browser + server + admin clients, schema.sql for the tables
  lib/auth/         the Clerk-or-demo session provider, plus the server session
supabase/
  migrations/       the schema as SQL — the source of truth
  seed.sql          the demo data, generated from the fixtures
scripts/            the generators and the seed/migration check
```

## 2. Platform reality

- **Turbopack is blocked on android/arm64 (Termux)** — the native bindings are
  unavailable there. Every script passes `--webpack`, which is why. Do not
  remove the flag without checking the target device.
- The native SWC binding cannot load on Termux; `@next/swc-wasm-nodejs` is the
  fallback there.
- `images.unoptimized` follows Vercel (on) and turns off where only the WASM
  sharp build exists. Override with `NEXT_IMAGE_OPTIMIZATION=on|off`.
- Memory is tight on the phone: keep dependencies minimal. The build uses a
  capped worker pool for that reason (`experimental.cpus` in `next.config.mjs`).

## 3. Commands

```bash
npm install
npm run dev        # next dev --webpack
npm run build      # next build --webpack
npm run start      # serve the production build
npm run lint       # eslint .
npm run typecheck  # tsc --noEmit
npm run check      # typecheck + lint
npm run db:seed    # regenerate supabase/seed.sql from the fixtures
npm run db:schema  # mirror the latest migration into src/lib/supabase/schema.sql
npm run db:check   # prove the seed still matches the migration
```

`apps/mobile` is the Capacitor app (Vite + React), kept for the native port.
It is a separate package with its own toolchain — type-check it there
(`npm --prefix apps/mobile run typecheck`), not with the root ESLint config.

## 4. The design system

- **Tokens live in `src/app/globals.css` under `@theme`, and nowhere else.**
  Components use the semantic utilities (`bg-paper`, `text-ink`, `text-muted`,
  `border-line`, `bg-brand-solid`, `rounded-card`…). Do not hard-code a hex
  value in a component; add a token.
- **Orange has three roles and they are not interchangeable.**
  `--color-brand` (#fc5303) is for graphics (the mark, the pulse, the route).
  `--color-brand-solid` (#d63f08) is for any fill that carries white text.
  `--color-brand-ink` (#c33c08) is for orange text on the paper ground.
  Using the vivid orange behind a 14px white label fails AA.
- **One typeface:** Inter Variable, self-hosted through `@fontsource-variable/inter`.
- **No kickers or eyebrows above headings.** The heading carries its own weight.
- **Status is never colour alone** — every state chip carries an icon and a word.
- **Icons come from Lucide** through `src/components/flash/Icon.tsx`, under
  ScalDive's own semantic names. Do not inline a one-off SVG glyph; add a name to
  the icon map.
- **Photography must carry alt text that describes the frame**, not the menu
  item beside it. Every file under `public/assets/` is catalogued in
  `docs/assets-provenance.md`.
- The design system itself is written down in `DESIGN.md` (and the machine
  readable sidecar in `.impeccable/design.json`). Change the world there first.

## 5. The data layer

- **The migration is the source of truth.** `supabase/migrations/*.sql` is what a
  database actually runs. `src/lib/supabase/schema.sql` is a generated mirror of
  it (`npm run db:schema`) — do not edit it by hand.
- **The seed is generated from the fixtures.** `npm run db:seed` rebuilds
  `supabase/seed.sql` from `src/lib/flash/data/*`, so the database and the demo
  always tell the same story. Change a fixture, re-run the generator, then
  `npm run db:check`.
- **The browser never touches Postgres.** Reads and writes go through the
  Next.js server. The service-role key lives in `src/lib/supabase/admin.ts`,
  which is marked `server-only`; the service role bypasses Row Level Security,
  so every query in the repository has to scope itself to the signed-in
  customer.
- **Writes go through `src/lib/flash/actions.ts`.** The four mutations
  re-read the price from the database instead of trusting the browser, and
  they answer from the fixtures (and say so) when no database is connected.
- **Ids are text, and they are stable.** Fixture rows keep their fixture ids
  (`evt-…`, `rst-…`, `mi-…`); runtime rows get minted ids from the app.

## 6. File storage

- **Cloudinary is the only file store.** Postgres holds URLs, never bytes, and
  `public/assets/images/` is a fixed demo catalogue, not an upload target.
- All uploads go through `src/lib/media/` and one server action. The browser
  never holds a Cloudinary credential and never uploads directly.
- Validation is on bytes (magic numbers, ≤ 8 MB), never on the declared MIME
  type. Every upload must carry the incoming transformation in
  `src/lib/media/cloudinary.ts`: `c_limit,w_2400,h_2400,q_auto:good`, webp.
  Never put `f_auto` in an incoming transformation — it is a delivery-only
  instruction.
- Replacing a stored image destroys the old asset; a failed database write
  destroys the new one. `isOwnedCloudinaryUrl` binds a URL to its uploader
  before any write.

## 7. Do NOT

- Do **not** invent a payment provider, a rating count, a delivery estimate or
  a map tile that the product does not have. The route diagram is a diagram;
  the payment picker says no provider is connected; prices and ratings are
  labelled demo data.
- Do **not** add a second accent colour or a second typeface.
- Do **not** put the account in the bottom navigation.
- Do **not** commit real secrets. `.env` is gitignored; only `.env.example` is
  tracked.
- Do **not** edit `src/lib/flash/data/*` expecting the app to change shape —
  the data layer is a demo fixture set shaped like the Postgres schema in
  `src/lib/supabase/schema.sql`. Changing the schema means changing both, and
  re-running `npm run db:seed`.
- Do **not** let a client component import the repository, the admin client or
  the server session. They are server-only.

## 8. Before you call a task done

```bash
npm run check
npm run build
npm run db:check
npm run media:check
```

Then look at the screens: `.impeccable/review/` holds the phone (390) and
desktop (1440) captures, and the Impeccable detector should be clean:

```bash
impeccable detect --json .
```
