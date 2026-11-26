# Business console — design

Date: 2026-11-18
Status: approved for implementation

## Goal

Give every ScalDive business its own durable console: two businesses of the same
kind own separate venues, orders, tickets, and menus, reached at a URL that
names the business. Keep the phone shell exactly as it is today, and give the
desktop screen a dedicated console chrome instead of the social rail.

Out of scope: driver console, creating or editing a business outside the apply
flow, auth changes, and hardening the remaining server actions.

## Decisions

- **Ownership lives in the schema.** `restaurants` and `events` gain a nullable
  `business_id` referencing `businesses (id) on delete cascade`. A business is
  owned through `businesses.user_id`; a venue is owned through its business. The
  old `owner_user_id` columns stay, because seed rows and owners without a
  business still need them.
- **Backfill is deterministic.** Existing venue rows are attached to the
  owner's oldest business of the matching kind: `distinct on (user_id) … order
  by user_id, created_at asc, id asc`. Rows whose owner has no business of that
  kind keep a null `business_id`.
- **Cardinality is explicit.** One restaurant per business:
  `create unique index restaurants_business_id_key on public.restaurants
  (business_id)`. An events company sells many events:
  `create index events_business_id_idx on public.events (business_id)`.
- **URLs name the business.** `/dashboard/restaurant/[businessId]` and
  `/dashboard/events/[businessId]`. The bare `/dashboard/restaurant` and
  `/dashboard/events` redirect to the first owned business of that kind
  (approved first, then any), and to `/dashboard` when there is none. An
  unknown, foreign, or wrong-kind id is `notFound()`.
- **One resolver.** A server-side `getOwnedBusiness(businessId, kind)` reads
  `listBusinesses()` and returns the matching business only when
  `businesses.user_id` is the signed-in customer. Routes and actions share it.
- **The console is its own route group.** `src/app/(console)/` owns
  `/dashboard*` with its own layout. The social `(app)` layout's side rail, top
  bar, and right rail do not render on console routes. URLs do not change. Two
  route groups cannot own the same URL, so every dashboard page moves.
- **Desktop chrome is per page.** A layout cannot read a child's `params`, so
  each console page renders a client `ConsoleShell` around server-rendered
  children: a fixed ~240px sidebar (ScalDive mark back-link, business switcher,
  section nav with scroll-spy, then Your dashboard / Your account) beside a
  widened single content column. `ConsoleHeader` stays a server component.
- **Mobile keeps today's pattern.** `ConsoleShell` hides at `lg`; the existing
  page header with the hamburger and the shared bottom nav stay. The drawer and
  the sidebar read the same section map and the same scroll-spy hook.
- **Writes are business-scoped.** `publishEvent` and `publishMenuItem` take a
  `businessId`, resolve it through `getOwnedBusiness`, and re-read prices from
  the database. `applyForBusiness` creates the business's venue row so a new
  owner lands in a working console.
- **Verification is the repo's own.** `npm run check`, `npm run build`,
  `npm run db:check`, and `npm run media:check` are the acceptance gate.

## Schema

One migration, timestamped after `20261117014000`, in four statements:

1. `alter table public.restaurants add column business_id text references
   public.businesses (id) on delete cascade;`
2. `alter table public.events add column business_id text references
   public.businesses (id) on delete cascade;`
3. A backfill `update … from (select distinct on (user_id) …)` for each table,
   matching `businesses.kind` to the table and ordering by `created_at`,
   `id`.
4. The indexes above.

`src/lib/supabase/schema.sql` and `supabase/seed.sql` are regenerated
(`npm run db:schema`, `npm run db:seed`) — neither is edited by hand.

## Data layer

`Restaurant` and `Event` gain `businessId?: string`; `RestaurantRow` and
`EventRow` gain `business_id`; the mappers pass it through. Two fixtures link
their demo business: `rst-auntie-muni` → `biz-auntie-muni` and
`evt-urban-vibes-festival` → `biz-urban-vibes`. The seed generator emits
`business_id` for restaurants and events.

The repository replaces the two "my first venue" reads:

- `listMyKitchens()` becomes `listKitchen(businessId)`.
- `listMyEvents()` becomes `listEventsForBusiness(businessId)`.

`listIncomingOrders(restaurantId)` and `listIncomingTickets(eventIds)` keep
their shapes and are fed by the resolved venue ids. Every query still scopes
itself to the signed-in customer; the service role bypasses RLS.

## Writes

`publishEvent` gains `businessId` in its input and checks the resolved business
is approved and of kind `events` before inserting. `publishMenuItem` checks the
restaurant row it is inserting into belongs to the resolved business, not just
to the user. `applyForBusiness` inserts a matching `restaurants` row on the
restaurant path (demo fixture and live insert); a business with no venue row
shows a "finish setup" empty state rather than an empty console.

## Acceptance

- Two approved businesses of the same kind show different venues, orders, and
  menus at their own URLs.
- The switcher lists every owned business and marks the current one.
- Bare console paths redirect correctly; foreign ids 404.
- Sidebar and drawer expose the same sections — nothing invented.
- `npm run check`, `npm run build`, `npm run db:check`, `npm run media:check`
  all pass.
