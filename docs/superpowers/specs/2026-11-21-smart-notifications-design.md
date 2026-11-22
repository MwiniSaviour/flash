# Smart notifications for Flash — design

Date: 2026-11-21
Status: proposed

## Goal

One notification funnel that announces: new delivery offers/assignments to
drivers (owned by the shared dispatch engine, reused here), purchase and
booking confirmations plus completions to customers, new orders to food
vendors, new ticket sales to event managers, and an order-completion email.
Delivery works on the web and on the in-progress Capacitor app, with one token
registry and one payload contract.

## Sources reviewed

- `web projects/ecommerce`: `backend/src/notifications.ts` (the `notify()`
  funnel, FCM + Resend adapters, semantic helpers), `routes/v1/notifications.ts`
  (token registry + inbox API), `src/lib/notifications.ts` (TTS/alerts),
  `assignment.ts` (`notifyDriverOffer`), `recommend/push.ts`.
- Flash: `src/lib/flash/actions.ts` (the four writes), `notifications.ts`
  (derived inbox), `NotificationInbox.tsx`, `notification_reads` migration,
  `src/lib/dispatch/*`, the Paystack webhook, `fulfilPayment`, and the business
  consoles.

## Decisions

1. **One self-contained funnel in Flash.** A new server-only module
   `src/lib/notifications/` mirrors the reference: persist one row per
   recipient, fan out to push + email in parallel, record per-channel status,
   and never throw. Callers use `void notify…()` fire-and-forget. The shared
   dispatch engine keeps owning driver offers (`notifyDriverOffer`); Flash
   sends the jobs that trigger them.
2. **One token registry, two transports.** `notification_tokens` stores a
   `platform` of `web | android | ios`. Web subscriptions go out through Web
   Push/VAPID (`web-push`, service worker). Native tokens go out through FCM
   HTTP v1 (service-account JWT signed with Node's built-in `crypto` — no extra
   dep). One `NotifyInput` produces both payloads, including `speakText` and
   `priority` so the Capacitor driver app can voice urgent offers.
3. **Email is Resend over HTTP** (plain `fetch`, no dependency). Missing keys
   always degrade to `skipped`; dispatch failures are logged, never propagated
   into a checkout or assignment.
4. **Real events only.** Notifications are persisted from actual writes; the
   existing derived inbox (pending tickets, active orders, decisions, failed
   payments) is merged into the same view so the demo stays honest.
5. **Scoped reads.** All token and notification reads/writes are scoped to the
   signed-in user via the service-role client; business notifications are
   scoped to an owned business resolved from the restaurant/event owner.
6. **Progressive enhancement.** Without Supabase/keys the app keeps serving
   fixtures and a demo inbox; enabling keys turns the same screens live.

## Architecture

```
src/lib/notifications/
  types.ts        NotifyInput, NotificationKind, channel status, channel payload
  service.ts      notify() funnel + semantic helpers (purchase, new-order,
                  completion, payment-received)
  push.ts         dispatchPush(): web (web-push) + native (FCM HTTP v1)
  email.ts        Resend sender + templates (text)
  inbox.ts        getNotifications(userId), getBusinessNotifications(businessId)
src/app/api/notifications/
  tokens/route.ts     POST upsert, DELETE (web subscription or native token)
  route.ts            GET list + unreadCount
  read/route.ts       POST mark read (ids or all)
public/sw.js        push + notificationclick handler
src/components/flash/PushRegistrationBridge.tsx   web subscribe + native token
src/components/dashboard/NotificationInbox.tsx    extended (persisted + derived)
```

## Data flow

- `placeOrder` → buyer "Order placed" + vendor (restaurant owner) "New order".
- `bookTicket` / `bookTicketBatch` → buyer "Booking confirmed" + event manager
  (event owner) "New ticket sale".
- `requestRide` / `sendParcel` → buyer "Booking confirmed"; engine assigns a
  driver and sends the driver offer/assignment push itself.
- `fulfilPayment` (Paystack `charge.success`) → "Payment received" and the
  **order-completion email** for the relevant kind.
- `confirmDeliveryAction` and dispatch `delivered` sync → "Booking completed"
  to buyer (and vendor where relevant).
- Each `notify()` persists `notifications` then calls `dispatchPush` and
  `sendEmail` in `Promise.all`, writing back `push_status`/`email_status`.

## Schema (new migration)

- `notifications`: `id`, `user_id`, `business_id` (nullable), `kind`, `title`,
  `body`, `speak_text`, `priority`, `ref_type`, `ref_id`, `read_at`,
  `push_status`, `email_status`, `created_at`; indexes on
  `(user_id, created_at desc)` and `(business_id, created_at desc)`.
- `notification_tokens`: `token` PK, `user_id`, `platform`, `app_id`, optional
  `p256dh`/`auth` for web, `last_seen_at`, `created_at`; index on `(user_id)`.
- RLS enabled, service-role only (browser never touches Postgres directly).
- Refresh `src/lib/supabase/schema.sql` via `npm run db:schema` and the seed via
  `npm run db:seed` (no seed rows needed for these tables).

## Config (`.env.example` + `getEnv`)

`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
`FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT_JSON`, `RESEND_API_KEY`,
`NOTIFICATIONS_FROM_EMAIL`. Add `hasNotificationsEnv()` helpers; no deploy
breaks when they are absent.

## UI

- Customer bell/page: merge persisted events and derived items, unread count,
  mark read (persisted rows via `read_at`, derived via `notification_reads`).
- Business console: a scoped notification inbox (bell + unread) usable by both
  restaurant and events dashboards via the shared console shell, plus a
  `/dashboard/notifications` page.
- Push registration bridge mounts in the app layout; asks permission,
  subscribes web or registers native token only when signed in.

## Error handling & observability

- `notify()` wrapped in try/catch; one bad recipient never stops a batch.
- Per-channel `skipped | sent | failed` status on every row.
- Stale/invalid tokens removed on push failure where possible.
- All failures logged with a `[notifications]` prefix; no secrets logged.

## Testing

- Vitest unit tests: copy builders, web/native payload construction, channel
  status transitions, inbox merge/scoping, token ownership checks.
- `scripts/check-notifications.mjs`: verify env docs, migration presence and
  trigger wiring (as the repo does for media/payments).
- Full gates: `npm run check`, `npm run build`, `npm run db:check`,
  `npm run media:check`, `npm run notifications:check`.

## Out of scope

- Native Capacitor app UI and voice playback (another branch) — this design
  only defines the token registration contract and the payload it consumes.
- Web Push/VAPID key generation and FCM/Resend account setup (deployment ops).
- Recommendation/smart-deal push scheduling (not requested).
