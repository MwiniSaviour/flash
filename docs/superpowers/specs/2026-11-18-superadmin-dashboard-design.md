# Superadmin dashboard — design

Date: 2026-11-18
Status: approved for implementation

## Goal

Give Flash a production superadmin surface at `/admin` that monitors platform
activity across customers, businesses, orders, tickets, rides, parcels,
payments and payouts. The screen takes its anatomy from the supplied admin
reference — grouped sidebar, sticky top bar, KPI grid, chart panel, activity
column — in Flash's warm-paper design system, with no dark theme and no demo
labelling.

Out of scope: cloning the reference repository, a driver console, chat/email,
marketing/analytics pages from the template, and a charting dependency.

## Decisions

- **Build, do not clone.** `NextAdminHQ/nextjs-admin-dashboard` has no OSS
  license (its license page permits only paid tiers and excludes SaaS
  end-products without an Extended license), 31 runtime dependencies, a
  Tailgrids token vocabulary that collides with Flash's, hard-coded indigo and
  dark-mode CSS, and widgets bound to mock APIs. It is read-only reference for
  layout patterns. Everything shipped is built from Flash primitives.
- **No demo bypass.** Every admin page and every admin read is gated on the
  server by `requireAdmin()`. The authoritative check is the Clerk identity's
  `publicMetadata.role === "admin"`; when Supabase is connected,
  `profiles.role` is read as the mirror. A signed-out or non-admin visitor gets
  `notFound()`. Client flags are never the gate.
- **Clerk test identity.** A Clerk dev application and one admin user are
  created with the Clerk CLI; keys go in untracked `.env.local`. No fixture
  user is marked admin and no screen carries a demo badge.
- **One data seam.** `src/lib/flash/admin-repository.ts` is server-only and
  owns every system-wide read. It uses the admin client when connected and the
  seeded fixture sets otherwise. It never trusts a browser-supplied amount,
  role or status.
- **Honest numbers only.** KPIs come from real columns. Payments and payouts
  are integer pesewas and are converted before display; orders/tickets/rides/
  parcels are whole cedis. Rides and parcels are *booked* value, not collected
  revenue. Where no rows exist the figure is zero and the table is empty —
  no invented money, charts, presence or activity.
- **Flash tokens only.** Paper ground, white cards, hairline borders, one
  orange signal, one typeface. Status always carries an icon and a word.
  The chart is drawn with SVG from real aggregates — no chart library.

## Routes

- `/admin` — overview: four KPI cards, activity chart with a period control,
  a recent-activity panel and a pending-approvals panel.
- `/admin/approvals` — business applications with approve/decline actions.
- `/admin/payments` — payment and payout ledgers with statuses and totals.
- `/admin/settings` — three commission rates in basis points and the payout
  hold window.
- The profile screen links to `/admin` for admins only.

## Charts and cards

The chart plots counts by period from `created_at`/`placed_at`/`purchased_at`,
not a fabricated smooth series. The period control selects 7/30/90 days. The
activity panel combines business decisions, new orders, ticket purchases and
ride/parcel requests. The approvals panel shows pending `businesses` rows with
kind and age, linking to the approvals page.

## Verification

`npm run check`, `npm run build`, `npm run db:check`, `npm run media:check`,
one Impeccable detector pass over the changed admin targets, and Playwright
flows covering: non-admin gets 404, admin loads `/admin`, approve/decline
works, settings save, and both desktop and phone layouts render.
