# Console management — design

Date: 2026-11-18
Status: approved for implementation

## Goal

Turn the two business consoles from read-only summaries into working management
screens: KPI cards on the overview, data tables with real create/edit/delete
actions, per-product discounts with scheduling, and a top bar that names the
shop and greets the owner. Everything an owner can see, they can change — from
a dish's tags and photograph to its price and discount window.

Out of scope: driver console, auth changes, a charting dependency, and editing
a business's legal details after application.

## Decisions

- **Chrome moves up, not out.** A server `ConsoleTopbar` sits above the page
  content and carries the shop name, a greeting and the account menu. The
  sidebar keeps the Flash mark, the business switcher and the section nav;
  "Your dashboard" and "Your account" are removed from it. The phone gets the
  same top bar above the existing page header and hamburger.
- **KPI cards follow the supplied reference's anatomy** — icon tile, large
  value, label, trend — but use Flash's paper/surface tokens and its existing
  semantic colours. No dark theme, no new accent. Four cards per console:
  kitchen = open orders, revenue, dishes, customers; events = tickets sold,
  revenue, events, attendees. Values derive from real rows. A trend appears
  only when a genuine comparison exists; no invented percentages. Beneath the
  cards sits a recent-activity table, not a fabricated chart.
- **Tables replace card lists.** One shared `DataTable` component renders
  columns, a header with a create button where creation is possible, an empty
  state and per-row Edit/Delete actions. No table or chart library is added.
- **Editing happens in a drawer.** A reusable `RecordDrawer` holds the form;
  create and edit use the same fields. Deleting asks for confirmation. Inline
  row editing is rejected because images, tags and descriptions do not fit.
- **Discounts belong to the product.** The "This week's offer" sections and
  `OfferEditor` are removed from both consoles. `menu_items` and
  `event_tiers` gain `discount_percent`, `discount_starts_at` and
  `discount_ends_at`. The restaurant-level `discount_percent` column stays in
  the schema for existing data but is no longer edited or displayed as the
  console's offer — the active product discount is the source of truth for
  storefront pricing.
- **A discount window is explicit.** Dates are ISO `YYYY-MM-DD`, matching
  `Event.date`. A window with no start is active immediately; no end means no
  expiry. Status is `none`, `scheduled`, `active` or `expired`, computed from a
  clock the server passes in: `DEMO_TODAY` when fixtures serve, today's UTC date
  when Postgres serves. The form rejects an end before its start.
- **Images are always editable.** Every product form shows the catalogue
  picker and the upload field. The upload field uses the existing
  `uploadImageAction`; with no Cloudinary credentials it states that plainly
  and the catalogue still works. No control silently disappears.
- **Copy is formal.** "What you cook" becomes "Dishes", "Your events" becomes
  "Events", "Your storefront" becomes "Storefront". No cute headings.
- **Customer identity is added where the tables need it.** `Order` and
  `Ticket` gain `userId` from their database rows, and the repository gains
  `listCustomers` that joins those ids to `profiles` for name and email. In
  fixture mode it uses the existing demo account fixture. Without this, the
  Customers and Attendees tables would be fabricated.
- **Product discounts reach the storefront.** A pure `effectiveDiscount`
  helper computes the active discount for a dish or tier from its window and
  the server clock. The food listing, dish order sheet and cart use it instead
  of the restaurant-level `discount_percent`, so a scheduled discount actually
  changes what a customer pays.
- **Scope stays inside the owned business.** Every read and write resolves the
  business from the URL through `getOwnedBusiness` and checks that the target
  row belongs to it. The service role bypasses RLS, so nothing relies on it.

## Chrome

The top bar is a server component. Left: the business name in bold with a
short greeting beneath it ("Good evening, Saviour" — the greeting respects
morning/afternoon/evening from the server clock). Right: the account control
moved out of the sidebar. On the phone the same bar renders above the page
header; the hamburger stays in the header and the bottom nav is unchanged.

The sidebar becomes: Flash mark back-link, business switcher (only at two or
more businesses), section nav with scroll-spy. Nothing else.

## Overview

Four KPI cards in a responsive grid (1 column on the phone, 2 at `sm`, 4 at
`lg`), each with a tinted icon tile, the value, its label and an optional
trend. Definitions:

| Console | Card | Source |
| --- | --- | --- |
| Kitchen | Open orders | Orders not yet `delivered` |
| Kitchen | Revenue | Sum of order subtotals |
| Kitchen | Dishes | Count of menu items |
| Kitchen | Customers | Distinct order user ids |
| Events | Tickets sold | Count of tickets |
| Events | Revenue | Sum of sold tier prices |
| Events | Events | Count of events owned by the business |
| Events | Attendees | Count of `confirmed` and `used` tickets |

Below, a "Recent activity" table lists the five newest orders or tickets with
their status and total. It is real data, not decoration.

## Data tables

| Console | Table | Columns | Row actions |
| --- | --- | --- | --- |
| Kitchen | Dishes | Name, Tags, Price, Discount, Status | Edit, Delete |
| Kitchen | Orders | Order, Customer, Total, Status | View, Accept/Complete |
| Kitchen | Customers | Name, Email, Orders, Spend | View orders |
| Events | Events | Name, Date, Venue, Tickets, Status | Edit, Close/Delete |
| Events | Tickets | Buyer, Event, Tier, Status | Confirm, View |
| Events | Attendees | Name, Email, Tickets, Status | View tickets |

Each table has a labelled create button where a create action exists: Add dish
on Dishes, Post event on Events. Status is never colour alone — every chip
carries a word, following the design system.

## Product editing

The drawer covers every field that makes a product: name, description, tags
(comma-separated, stored as `text[]`), image (catalogue plus upload), price,
availability, discount percent, start date and expiry date. Ticket tiers use
the same shape minus description and tags. Saving re-reads the price from the
database, as the existing actions do. Deleting a dish or event is confirmed;
the schema already sets dependent order lines and tier references to `null`,
so history survives. Events with tickets are never hard-deleted — the drawer
offers "Close event" instead, which sets it inactive.

## Data model

One migration after `20261118090000`:

- `alter table public.menu_items add column tags text[] not null default '{}', add column discount_percent integer not null default 0, add column discount_starts_at date, add column discount_ends_at date;`
- `alter table public.event_tiers add column discount_percent integer not null default 0, add column discount_starts_at date, add column discount_ends_at date;`
- Range checks on both `discount_percent` columns and window checks that the end is not before the start.

`MenuItem` and `TicketTier` gain the matching fields; row mappers, fixtures and
the seed generator carry them. `schema.sql` and `seed.sql` are regenerated —
neither is hand-edited.

## Writes

New server actions alongside the existing ones: `createMenuItem`,
`updateMenuItem`, `deleteMenuItem`, `createEvent`, `updateEvent`, `closeEvent`,
`updateTicketTier`, `deleteTicketTier`, and the per-product discount fields
folded into the update actions. Each resolves the business from a `businessId`
passed by the page, verifies ownership and approval where a publish is
involved, and revalidates that business's console URL. Existing price and
confirmation actions keep their shapes.

## Copy

"What you cook" → "Dishes". "Your events" → "Events". "Your storefront" →
"Storefront". "This week's offer" is removed entirely. Greetings and table
headings use the same register.

## Verification

`npm run check`, `npm run build`, `npm run db:check` and `npm run media:check`
must all pass. Review the rendered console at 390px and 1440px: KPI cards,
tables, drawer, top bar, discount states and image picker. No new dependencies.
