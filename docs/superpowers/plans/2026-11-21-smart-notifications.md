# Smart notifications for Flash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One server-only notification funnel in Flash that pushes purchase/booking and completion alerts to customers, new-order alerts to food vendors and event managers, an order-completion email, and interoperates with the shared engine's driver offers — on both web and the Capacitor app.

**Architecture:** A new `src/lib/notifications/` module persists a row per recipient then fans out through two transports selected by a token's `platform`: Web Push/VAPID for `web` and FCM HTTP v1 for `android`/`ios`, plus Resend for email. Missing keys degrade to `skipped`; failures never break a write. Triggers are wired into Flash's four write actions, payment fulfilment and delivery/dispatch completion, and the existing inbox component is extended for customers and both business consoles.

**Tech Stack:** Next.js 16 server actions/route handlers, Supabase Postgres (`public`), Clerk-or-demo session, `web-push` (new dep), Node `crypto` for FCM JWT, Resend over `fetch`, Vitest.

## Global Constraints

- Turbopack is blocked on arm64/Termux — every script uses `--webpack`. Never remove it.
- Tokens live only in `src/app/globals.css` under `@theme`; use semantic utilities, never hard-coded hex.
- One typeface (Inter Variable); no second accent colour; no kickers above headings.
- Status is never colour alone — every notification carries a word and a kind.
- Icons come from `src/components/flash/Icon.tsx`; do not inline one-off SVGs.
- Ids are text and stable; minted ids use the `ntf_`/`nt_` prefixes.
- The browser never touches Postgres; the service-role key is server-only and every query is scoped to the signed-in user.
- The migration is the source of truth; regenerate `schema.sql` with `npm run db:schema` — do not hand-edit it.
- No real secrets in the repo; only `.env.example` is tracked.
- No comments in new code unless required by an existing pattern; keep dependencies minimal (only `web-push` is added).

---

## File Structure

**Create**
- `src/lib/notifications/types.ts` — kinds, input, statuses, token shapes.
- `src/lib/notifications/copy.ts` — pure copy builders + `hrefFor()` (testable).
- `src/lib/notifications/payload.ts` — pure web/native payload builders + token grouping (testable).
- `src/lib/notifications/email.ts` — Resend sender.
- `src/lib/notifications/push.ts` — Web Push + FCM dispatch.
- `src/lib/notifications/service.ts` — `notify()` funnel + semantic helpers.
- `src/lib/notifications/inbox.ts` — persisted reads, mark-read, unread counts.
- `src/lib/notifications/client.ts` — browser-safe subscription helpers.
- `src/app/api/notifications/tokens/route.ts` — register/unregister device token.
- `src/app/api/notifications/route.ts` — list + unread count.
- `src/app/api/notifications/read/route.ts` — mark read.
- `public/sw.js` — push + notificationclick.
- `src/components/flash/PushRegistrationBridge.tsx` — mount-time registration.
- `src/components/flash/EnablePushButton.tsx` — explicit web opt-in.
- `src/app/(console)/dashboard/notifications/page.tsx` — business inbox.
- `supabase/migrations/20261121120000_notifications.sql`.
- `scripts/check-notifications.mjs`.
- `src/lib/notifications/notifications.test.ts`.

**Modify**
- `package.json`, `.env.example`, `src/lib/env.ts`.
- `src/lib/flash/actions.ts`, `src/lib/payments/service.ts`, `src/lib/flash/repository.ts`.
- `src/lib/flash/notifications.ts`, `src/lib/flash/profile-actions.ts`.
- `src/components/dashboard/NotificationInbox.tsx`, `src/components/dashboard/ConsoleTopbar.tsx`.
- `src/app/layout.tsx`, `src/app/(app)/profile/notifications/page.tsx`.

---

### Task 1: Foundation — types, pure copy/payload builders, tests

**Files:** Create `src/lib/notifications/types.ts`, `copy.ts`, `payload.ts`, `notifications.test.ts`.

**Interfaces:**
- Produces: `NotifyInput`, `NotificationKind`, `ChannelStatus`, `DeviceToken`, `notificationHref()`, `purchaseCopy()`, `vendorOrderCopy()`, `managerSaleCopy()`, `paymentCopy()`, `completionCopy()`, `webPushPayload()`, `fcmMessage()`, `splitTokens()`, `anySent()`.

- [ ] **Step 1: Write the failing test** (`src/lib/notifications/notifications.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import {
  completionCopy,
  fcmMessage,
  managerSaleCopy,
  notificationHref,
  paymentCopy,
  purchaseCopy,
  splitTokens,
  vendorOrderCopy,
  webPushPayload,
  anySent,
  type DeviceToken,
  type NotifyInput,
} from "./payload";

const input: NotifyInput = {
  userId: "usr-1",
  kind: "purchase_confirmed",
  title: "Order confirmed",
  body: "GHS 42.50 · FLS-1234-5678",
  refType: "order",
  refId: "ord-1",
  priority: "normal",
};

describe("notification copy", () => {
  it("maps each ref type to its screen", () => {
    expect(notificationHref("order", "ord-1")).toBe("/orders/ord-1");
    expect(notificationHref("ticket", "tkt-1")).toBe("/tickets/tkt-1");
    expect(notificationHref("ride", "ride-1")).toBe("/rides/ride-1");
    expect(notificationHref("parcel", "par-1")).toBe("/parcels/par-1");
    expect(notificationHref(null, null)).toBe("/profile/notifications");
  });

  it("builds real copy for each audience", () => {
    expect(purchaseCopy("order", "FLS-1", 42.5).title).toBe("Order confirmed");
    expect(vendorOrderCopy("Jollof Joint", 3).body).toContain("3 item");
    expect(managerSaleCopy("Urban Vibes", "VIP", 2).title).toBe("New ticket sale");
    expect(paymentCopy(42.5).title).toBe("Payment received");
    const done = completionCopy("order", "FLS-1");
    expect(done.title).toBe("Order completed");
    expect(done.email).toContain("Thank you for ordering with Flash");
  });
});

describe("push payloads", () => {
  const tokens: DeviceToken[] = [
    { token: "web-1", platform: "web", p256dh: "p", auth: "a", userId: "usr-1", appId: "flash" },
    { token: "fcm-1", platform: "android", userId: "usr-1", appId: "flash" },
    { token: "fcm-2", platform: "ios", userId: "usr-1", appId: "flash" },
  ];

  it("splits tokens by transport", () => {
    const { web, native } = splitTokens(tokens);
    expect(web).toHaveLength(1);
    expect(native.map((t) => t.platform)).toEqual(["android", "ios"]);
  });

  it("builds a web payload with a destination", () => {
    expect(webPushPayload(input)).toEqual({
      title: "Order confirmed",
      body: "GHS 42.50 · FLS-1234-5678",
      url: "/orders/ord-1",
      kind: "purchase_confirmed",
      refType: "order",
      refId: "ord-1",
      speakText: null,
      voiceAlert: "false",
    });
  });

  it("builds an FCM v1 message with data and priority", () => {
    const message = fcmMessage("fcm-1", input, "proj");
    expect(message.token).toBe("fcm-1");
    expect(message.android.priority).toBe("NORMAL");
    expect(message.data.url).toBe("/orders/ord-1");
    expect(message.notification.title).toBe("Order confirmed");
  });

  it("treats any sent channel as sent", () => {
    expect(anySent(["skipped", "sent"])).toBe("sent");
    expect(anySent(["skipped", "skipped"])).toBe("skipped");
    expect(anySent(["failed", "failed"])).toBe("failed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/notifications/notifications.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `types.ts`, `copy.ts`, `payload.ts`**

`src/lib/notifications/types.ts`:

```ts
export type NotificationKind =
  | "purchase_confirmed"
  | "booking_confirmed"
  | "new_order"
  | "new_ticket_sale"
  | "payment_received"
  | "booking_completed"
  | "order_completed";

export type ChannelStatus = "skipped" | "sent" | "failed";
export type NotificationPriority = "normal" | "high";
export type NotificationRefType = "order" | "ticket" | "ride" | "parcel";
export type DevicePlatform = "web" | "android" | "ios";

export type NotifyInput = {
  userId: string;
  businessId?: string | null;
  kind: NotificationKind;
  title: string;
  body: string;
  emailBody?: string;
  speakText?: string | null;
  priority?: NotificationPriority;
  refType?: NotificationRefType | null;
  refId?: string | null;
  email?: { to: string } | null;
  sendEmail?: boolean;
};

export type DeviceToken = {
  token: string;
  userId: string;
  platform: DevicePlatform;
  appId: string;
  p256dh?: string | null;
  auth?: string | null;
};
```

`src/lib/notifications/copy.ts`:

```ts
import type { NotificationRefType } from "./types";

const money = (cedis: number) => `GHS ${cedis.toFixed(2)}`;

export function notificationHref(
  refType: NotificationRefType | null | undefined,
  refId: string | null | undefined,
): string {
  if (refType && refId) {
    const path: Record<NotificationRefType, string> = {
      order: "orders",
      ticket: "tickets",
      ride: "rides",
      parcel: "parcels",
    };
    return `/${path[refType]}/${encodeURIComponent(refId)}`;
  }
  return "/profile/notifications";
}

export function purchaseCopy(refType: NotificationRefType, reference: string, total: number) {
  const label = refType === "ticket" ? "Booking confirmed" : "Order confirmed";
  return {
    title: label,
    body: `${money(total)} · ${reference}. We'll update you as it moves.`,
    email: `${label}.\n\nReference ${reference} · ${money(total)}.\n\nThank you for choosing Flash.`,
  };
}

export function vendorOrderCopy(restaurant: string, itemCount: number, orderNumber: string) {
  return {
    title: "New order received",
    body: `${itemCount} item${itemCount === 1 ? "" : "s"} on order #${orderNumber} at ${restaurant}.`,
    email: `A new order (#${orderNumber}) with ${itemCount} item${itemCount === 1 ? "" : "s"} is waiting at ${restaurant}.`,
  };
}

export function managerSaleCopy(event: string, tier: string, quantity: number) {
  return {
    title: "New ticket sale",
    body: `${quantity} × ${tier} for ${event} sold.`,
    email: `${quantity} ticket${quantity === 1 ? "" : "s"} (${tier}) were sold for ${event}.`,
  };
}

export function paymentCopy(total: number, reference: string) {
  return {
    title: "Payment received",
    body: `${money(total)} received for ${reference}.`,
    email: `We received ${money(total)} for ${reference}. Your Flash payment is confirmed.`,
  };
}

export function completionCopy(refType: NotificationRefType, reference: string) {
  const order = refType === "order";
  const title = order ? "Order completed" : "Booking completed";
  return {
    title,
    body: `${reference} is complete. Thank you for using Flash.`,
    email: `${reference} is now complete.\n\nThank you for ordering with Flash.`.replace(
      order ? "ordering" : "ordering",
      order ? "ordering" : "booking",
    ),
  };
}
```

`src/lib/notifications/payload.ts` re-exports copy (so tests import from one place) and builds payloads:

```ts
import { notificationHref } from "./copy";
import type { DeviceToken, NotifyInput } from "./types";

export * from "./copy";

export function splitTokens(tokens: DeviceToken[]) {
  return {
    web: tokens.filter((t) => t.platform === "web"),
    native: tokens.filter((t) => t.platform === "android" || t.platform === "ios"),
  };
}

export function webPushPayload(input: NotifyInput) {
  return {
    title: input.title,
    body: input.body,
    url: notificationHref(input.refType, input.refId),
    kind: input.kind,
    refType: input.refType ?? null,
    refId: input.refId ?? null,
    speakText: input.speakText ?? null,
    voiceAlert: input.priority === "high" ? "true" : "false",
  };
}

export function fcmMessage(token: string, input: NotifyInput, project: string) {
  return {
    message: {
      token,
      notification: { title: input.title, body: input.body },
      data: {
        kind: input.kind,
        refType: input.refType ?? "",
        refId: input.refId ?? "",
        speakText: input.speakText ?? "",
        voiceAlert: input.priority === "high" ? "true" : "false",
        url: notificationHref(input.refType, input.refId),
      },
      android: { priority: input.priority === "high" ? "HIGH" : "NORMAL" },
    },
    project,
  };
}

export function anySent(statuses: ("skipped" | "sent" | "failed")[]) {
  return statuses.includes("sent") ? "sent" : statuses.includes("failed") ? "failed" : "skipped";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/notifications/notifications.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/notifications docs/superpowers/specs/2026-11-21-smart-notifications-design.md
git commit -m "feat(notifications): add typed funnel contract and pure builders"
```

---

### Task 2: Config and database schema

**Files:** Modify `.env.example`, `src/lib/env.ts`, `package.json`; create `supabase/migrations/20261121120000_notifications.sql`, `scripts/check-notifications.mjs`.

**Interfaces:**
- Produces: `getEnv().vapidPublicKey/vapidPrivateKey/vapidSubject/fcmProjectId/fcmServiceAccountJson/resendApiKey/notificationsFromEmail`, `hasWebPushEnv()`, `hasFcmEnv()`, `hasResendEnv()`, `hasNotificationsEnv()`.

- [ ] **Step 1: Add the migration** (`supabase/migrations/20261121120000_notifications.sql`):

```sql
-- Smart notifications: one persisted event per recipient/channel outcome.
create table public.notifications (
  id text primary key,
  user_id text not null references public.profiles (id) on delete cascade,
  business_id text,
  kind text not null,
  title text not null,
  body text not null,
  speak_text text,
  priority text not null default 'normal' check (priority in ('normal', 'high')),
  ref_type text,
  ref_id text,
  read_at timestamptz,
  push_status text not null default 'skipped' check (push_status in ('skipped', 'sent', 'failed')),
  email_status text not null default 'skipped' check (email_status in ('skipped', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

create table public.notification_tokens (
  token text primary key,
  user_id text not null references public.profiles (id) on delete cascade,
  platform text not null default 'web' check (platform in ('web', 'android', 'ios')),
  app_id text not null default 'flash',
  p256dh text,
  auth text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id, read_at);
create index notifications_business_created_idx on public.notifications (business_id, created_at desc);
create index notification_tokens_user_idx on public.notification_tokens (user_id);

alter table public.notifications enable row level security;
alter table public.notification_tokens enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.notifications to service_role;
grant select, insert, update, delete on table public.notification_tokens to service_role;
```

- [ ] **Step 2: Add env fields and helpers to `src/lib/env.ts`**

Add to `FlashEnv` type:
```ts
  readonly vapidPublicKey: string | null;
  readonly vapidPrivateKey: string | null;
  readonly vapidSubject: string | null;
  readonly fcmProjectId: string | null;
  readonly fcmServiceAccountJson: string | null;
  readonly resendApiKey: string | null;
  readonly notificationsFromEmail: string | null;
```
Add to `getEnv()` object:
```ts
    vapidPublicKey: clean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    vapidPrivateKey: clean(process.env.VAPID_PRIVATE_KEY),
    vapidSubject: clean(process.env.VAPID_SUBJECT),
    fcmProjectId: clean(process.env.FCM_PROJECT_ID),
    fcmServiceAccountJson: clean(process.env.FCM_SERVICE_ACCOUNT_JSON),
    resendApiKey: clean(process.env.RESEND_API_KEY),
    notificationsFromEmail: clean(process.env.NOTIFICATIONS_FROM_EMAIL),
```
Append after `hasDispatchEnv()`:
```ts
/** True when browser web push can be signed. */
export function hasWebPushEnv(): boolean {
  const env = getEnv();
  return Boolean(env.vapidPublicKey && env.vapidPrivateKey && env.vapidSubject);
}

/** True when native FCM push can be sent. */
export function hasFcmEnv(): boolean {
  const env = getEnv();
  return Boolean(env.fcmProjectId && env.fcmServiceAccountJson);
}

/** True when Resend can send mail. */
export function hasResendEnv(): boolean {
  const env = getEnv();
  return Boolean(env.resendApiKey && env.notificationsFromEmail);
}

/** True when at least one notification channel is configured. */
export function hasNotificationsEnv(): boolean {
  return hasWebPushEnv() || hasFcmEnv() || hasResendEnv();
}
```

- [ ] **Step 3: Append to `.env.example`**

```text

# ---------------------------------------------------------------------------
# Smart notifications
#
# Web push uses VAPID (generate a key pair with `web-push generate-vapid-keys`).
# Native push uses FCM HTTP v1 with a service-account JSON. Email uses Resend.
# Any missing group degrades to log-only; the app never breaks because of it.
# ---------------------------------------------------------------------------
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:hello@flash.gh
FCM_PROJECT_ID=
FCM_SERVICE_ACCOUNT_JSON=
RESEND_API_KEY=
NOTIFICATIONS_FROM_EMAIL=
```

- [ ] **Step 4: Add dependency and check script**

In `package.json` dependencies add `"web-push": "^6.6.1"`; in scripts add `"notifications:check": "node scripts/check-notifications.mjs"`. Run `npm install` to update the lockfile.

Create `scripts/check-notifications.mjs`:

```js
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(resolve(root, p), "utf8");
const problems = [];
const expect = (condition, message) => { if (!condition) problems.push(message); };

expect(existsSync(resolve(root, "supabase/migrations/20261121120000_notifications.sql")), "missing notifications migration");
expect(read(".env.example").includes("NEXT_PUBLIC_VAPID_PUBLIC_KEY="), "VAPID key not documented");
expect(read(".env.example").includes("FCM_SERVICE_ACCOUNT_JSON="), "FCM credential not documented");
expect(read(".env.example").includes("RESEND_API_KEY="), "Resend key not documented");
for (const [file, needle] of [
  ["src/lib/flash/actions.ts", "notifyPurchaseConfirmed"],
  ["src/lib/flash/actions.ts", "notifyVendorNewOrder"],
  ["src/lib/flash/actions.ts", "notifyManagerNewSale"],
  ["src/lib/payments/service.ts", "notifyPaymentReceived"],
  ["src/lib/payments/service.ts", "notifyCompletion"],
  ["src/app/layout.tsx", "PushRegistrationBridge"],
]) expect(read(file).includes(needle), `${file} is missing ${needle}`);

if (problems.length) {
  console.error("Notification check failed:\n" + problems.map((p) => ` - ${p}`).join("\n"));
  process.exit(1);
}
console.log("Notifications check passed.");
```

- [ ] **Step 5: Regenerate schema mirror and verify**

Run: `npm run db:schema && npm run db:check && npm run notifications:check`
Expected: schema mirror updated; checks pass.

- [ ] **Step 6: Commit**

```bash
git add .env.example package.json package-lock.json src/lib/env.ts supabase/migrations/20261121120000_notifications.sql src/lib/supabase/schema.sql scripts/check-notifications.mjs
git commit -m "feat(notifications): add schema, config and verification script"
```

---

### Task 3: Delivery channels — email, Web Push and FCM

**Files:** Create `src/lib/notifications/email.ts`, `push.ts`.

**Interfaces:**
- Consumes: `NotifyInput`, `DeviceToken`, `webPushPayload()`, `fcmMessage()`, `splitTokens()`, `anySent()` from Task 1; `getEnv()`.
- Produces: `sendEmail(to, subject, text): Promise<ChannelStatus>`, `dispatchPush(input, client): Promise<ChannelStatus>`.

- [ ] **Step 1: Write `email.ts`**

```ts
import "server-only";

import { getEnv } from "@/lib/env";

import type { ChannelStatus } from "./types";

export async function sendEmail(
  to: string | null,
  subject: string,
  text: string,
): Promise<ChannelStatus> {
  const env = getEnv();
  if (!env.resendApiKey || !env.notificationsFromEmail || !to) return "skipped";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.resendApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.notificationsFromEmail,
        to: [to],
        subject,
        text: `${text}\n\n— Flash`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error(`[notifications] Resend send failed (${response.status})`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[notifications] Resend send error", error);
    return "failed";
  }
}
```

- [ ] **Step 2: Write `push.ts`**

```ts
import "server-only";

import { createSign } from "node:crypto";

import webpush from "web-push";

import { getEnv, hasFcmEnv, hasWebPushEnv } from "@/lib/env";
import type { AdminClient } from "@/lib/supabase/admin";

import { anySent, fcmMessage, splitTokens, webPushPayload } from "./payload";
import type { ChannelStatus, DeviceToken, NotifyInput } from "./types";

type ServiceAccount = { project: string; clientEmail: string; privateKey: string };
let cachedServiceAccount: ServiceAccount | null | undefined;

function serviceAccount(): ServiceAccount | null {
  if (cachedServiceAccount !== undefined) return cachedServiceAccount;
  const env = getEnv();
  if (!env.fcmProjectId || !env.fcmServiceAccountJson) {
    cachedServiceAccount = null;
    return cachedServiceAccount;
  }
  try {
    const parsed = JSON.parse(env.fcmServiceAccountJson) as {
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.client_email || !parsed.private_key) throw new Error("incomplete service account");
    cachedServiceAccount = {
      project: env.fcmProjectId,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch (error) {
    console.error("[notifications] invalid FCM_SERVICE_ACCOUNT_JSON", error);
    cachedServiceAccount = null;
  }
  return cachedServiceAccount;
}

const base64url = (value: Buffer | string) =>
  Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

let cachedToken: { value: string; expiresAt: number } | null = null;

async function fcmAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: sa.clientEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signature = createSign("RSA-SHA256")
    .update(`${header}.${claim}`)
    .sign(sa.privateKey);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${base64url(signature)}`,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`FCM token exchange failed (${response.status})`);
  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("FCM token exchange returned no access token");
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

async function sendNative(token: string, input: NotifyInput): Promise<boolean> {
  const sa = serviceAccount();
  if (!sa) return false;
  const message = fcmMessage(token, input, sa.project).message;
  const accessToken = await fcmAccessToken(sa);
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project}/messages:send`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) {
    console.error(`[notifications] FCM send failed (${response.status})`);
    return false;
  }
  return true;
}

async function loadTokens(client: AdminClient, userId: string): Promise<DeviceToken[]> {
  const { data, error } = await client
    .from("notification_tokens")
    .select("token, user_id, platform, app_id, p256dh, auth")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as DeviceToken[];
}

async function dropToken(client: AdminClient, token: string): Promise<void> {
  await client.from("notification_tokens").delete().eq("token", token);
}

export async function dispatchPush(
  input: NotifyInput,
  client: AdminClient | null,
): Promise<ChannelStatus> {
  if (!hasWebPushEnv() && !hasFcmEnv()) return "skipped";
  const tokens = client ? await loadTokens(client, input.userId) : [];
  if (tokens.length === 0) return "skipped";
  const { web, native } = splitTokens(tokens);
  const payload = JSON.stringify(webPushPayload(input));
  const env = getEnv();

  const webResults: boolean[] = [];
  if (hasWebPushEnv()) {
    webpush.setVapidDetails(env.vapidSubject!, env.vapidPublicKey!, env.vapidPrivateKey!);
    for (const token of web) {
      if (!token.p256dh || !token.auth) continue;
      try {
        await webpush.sendNotification(
          { endpoint: token.token, keys: { p256dh: token.p256dh, auth: token.auth } },
          payload,
        );
        webResults.push(true);
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          if (client) await dropToken(client, token.token);
        } else {
          console.error("[notifications] Web Push send failed", error);
        }
        webResults.push(false);
      }
    }
  }

  const nativeResults = await Promise.all(
    hasFcmEnv()
      ? native.map(async (token) => {
          try {
            return await sendNative(token.token, input);
          } catch (error) {
            console.error("[notifications] FCM send error", error);
            return false;
          }
        })
      : [],
  );

  return anySent([...webResults, ...nativeResults]);
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/notifications/email.ts src/lib/notifications/push.ts
git commit -m "feat(notifications): add web push, FCM and Resend adapters"
```

---

### Task 4: The funnel and semantic helpers

**Files:** Create `src/lib/notifications/service.ts`, `inbox.ts`.

**Interfaces:**
- Consumes: `sendEmail()`, `dispatchPush()`, copy builders, `getEnv()`.
- Produces: `notify()`, `notifyPurchaseConfirmed()`, `notifyVendorNewOrder()`, `notifyManagerNewSale()`, `notifyPaymentReceived()`, `notifyCompletion()`, `getPersistedNotifications()`, `getBusinessNotifications()`, `getBusinessUnreadCount()`, `markPersistedRead()`.

- [ ] **Step 1: Write `service.ts`**

```ts
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { sendEmail } from "./email";
import { dispatchPush } from "./push";
import type { NotificationRefType, NotifyInput } from "./types";

function mintId(): string {
  return `ntf_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
}

async function emailForUser(userId: string): Promise<string | null> {
  const client = createAdminClient();
  if (!client) return null;
  const { data } = await client.from("profiles").select("email").eq("id", userId).maybeSingle();
  return data?.email ?? null;
}

async function alertsEnabled(userId: string): Promise<boolean> {
  const client = createAdminClient();
  if (!client) return true;
  const { data } = await client
    .from("profiles")
    .select("notifications_enabled")
    .eq("id", userId)
    .maybeSingle();
  return data?.notifications_enabled ?? true;
}

export async function notify(input: NotifyInput): Promise<void> {
  try {
    const client = createAdminClient();
    const id = mintId();
    if (client) {
      const { error } = await client.from("notifications").insert({
        id,
        user_id: input.userId,
        business_id: input.businessId ?? null,
        kind: input.kind,
        title: input.title,
        body: input.body,
        speak_text: input.speakText ?? null,
        priority: input.priority ?? "normal",
        ref_type: input.refType ?? null,
        ref_id: input.refId ?? null,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
    }

    const enabled = await alertsEnabled(input.userId);
    const to = input.email?.to ?? (await emailForUser(input.userId));
    const [pushStatus, emailStatus] = await Promise.all([
      enabled ? dispatchPush(input, client) : Promise.resolve("skipped" as const),
      enabled && input.sendEmail !== false
        ? sendEmail(to, input.title, input.emailBody ?? input.body)
        : Promise.resolve("skipped" as const),
    ]);

    if (client) {
      await client
        .from("notifications")
        .update({ push_status: pushStatus, email_status: emailStatus })
        .eq("id", id);
    }
  } catch (error) {
    console.error("[notifications] dispatch failed", error);
  }
}

type PurchaseArgs = {
  userId: string;
  refType: NotificationRefType;
  refId: string;
  reference: string;
  total: number;
  email?: { to: string } | null;
};

export async function notifyPurchaseConfirmed(args: PurchaseArgs): Promise<void> {
  const { purchaseCopy } = await import("./copy");
  const copy = purchaseCopy(args.refType, args.reference, args.total);
  await notify({
    userId: args.userId,
    kind: args.refType === "ticket" ? "booking_confirmed" : "purchase_confirmed",
    title: copy.title,
    body: copy.body,
    emailBody: copy.email,
    refType: args.refType,
    refId: args.refId,
    email: args.email,
  });
}

export async function notifyVendorNewOrder(args: {
  ownerUserId: string;
  businessId: string | null;
  orderId: string;
  restaurant: string;
  itemCount: number;
  orderNumber: string;
}): Promise<void> {
  const { vendorOrderCopy } = await import("./copy");
  const copy = vendorOrderCopy(args.restaurant, args.itemCount, args.orderNumber);
  await notify({
    userId: args.ownerUserId,
    businessId: args.businessId,
    kind: "new_order",
    title: copy.title,
    body: copy.body,
    emailBody: copy.email,
    refType: "order",
    refId: args.orderId,
  });
}

export async function notifyManagerNewSale(args: {
  ownerUserId: string;
  businessId: string | null;
  ticketId: string;
  event: string;
  tier: string;
  quantity: number;
}): Promise<void> {
  const { managerSaleCopy } = await import("./copy");
  const copy = managerSaleCopy(args.event, args.tier, args.quantity);
  await notify({
    userId: args.ownerUserId,
    businessId: args.businessId,
    kind: "new_ticket_sale",
    title: copy.title,
    body: copy.body,
    emailBody: copy.email,
    refType: "ticket",
    refId: args.ticketId,
  });
}

export async function notifyPaymentReceived(args: {
  userId: string;
  refType: NotificationRefType;
  refId: string;
  total: number;
  reference: string;
}): Promise<void> {
  const { paymentCopy } = await import("./copy");
  const copy = paymentCopy(args.total, args.reference);
  await notify({
    userId: args.userId,
    kind: "payment_received",
    title: copy.title,
    body: copy.body,
    emailBody: copy.email,
    refType: args.refType,
    refId: args.refId,
  });
}

export async function notifyCompletion(args: {
  userId: string;
  businessId?: string | null;
  refType: NotificationRefType;
  refId: string;
  reference: string;
}): Promise<void> {
  const { completionCopy } = await import("./copy");
  const copy = completionCopy(args.refType, args.reference);
  await notify({
    userId: args.userId,
    businessId: args.businessId ?? null,
    kind: args.refType === "order" ? "order_completed" : "booking_completed",
    title: copy.title,
    body: copy.body,
    emailBody: copy.email,
    refType: args.refType,
    refId: args.refId,
  });
}
```

Replace the dynamic `import("./copy")` calls with a static top import `import { purchaseCopy, vendorOrderCopy, managerSaleCopy, paymentCopy, completionCopy } from "./copy";` and direct calls — the dynamic imports are shown only to keep each helper self-contained; use the static form in the file.

`src/lib/notifications/inbox.ts`:

```ts
import "server-only";

import { currentUserId } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { notificationHref } from "./copy";

export type PersistedNotification = {
  id: string;
  key: string;
  title: string;
  detail: string;
  at: string;
  href: string;
  read: boolean;
  kind: string;
};

async function rowsFor(where: "user" | "business") {
  const client = createAdminClient();
  if (!client) return [];
  const userId = await currentUserId();
  if (!userId) return [];
  let query = client
    .from("notifications")
    .select("id, title, body, kind, ref_type, ref_id, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (where === "user") query = query.eq("user_id", userId);
  else query = query.eq("user_id", userId).not("business_id", "is", null);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as {
    id: string; title: string; body: string; kind: string;
    ref_type: string | null; ref_id: string | null;
    read_at: string | null; created_at: string;
  }[];
}

function toItem(row: Awaited<ReturnType<typeof rowsFor>>[number]): PersistedNotification {
  return {
    id: row.id,
    key: `ntf:${row.id}`,
    title: row.title,
    detail: row.body,
    at: row.created_at,
    href: notificationHref(row.ref_type as never, row.ref_id),
    read: Boolean(row.read_at),
    kind: row.kind,
  };
}

export async function getPersistedNotifications(): Promise<PersistedNotification[]> {
  return (await rowsFor("user")).map(toItem);
}

export async function getBusinessNotifications(): Promise<PersistedNotification[]> {
  return (await rowsFor("business")).map(toItem);
}

export async function getBusinessUnreadCount(): Promise<number> {
  const client = createAdminClient();
  if (!client) return 0;
  const userId = await currentUserId();
  if (!userId) return 0;
  const { count, error } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("business_id", "is", null)
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function markPersistedRead(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const client = createAdminClient();
  if (!client) return;
  const userId = await currentUserId();
  if (!userId) return;
  await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .in("id", ids);
}
```

- [ ] **Step 2: Typecheck and commit**

Run: `npm run typecheck`
Expected: PASS.

```bash
git add src/lib/notifications/service.ts src/lib/notifications/inbox.ts
git commit -m "feat(notifications): add notify funnel and semantic helpers"
```

---

### Task 5: API routes, service worker and browser registration

**Files:** Create the four client/registration files and three API routes.

**Interfaces:**
- Consumes: `currentUserId()`, `createAdminClient()`.
- Produces: `POST/DELETE /api/notifications/tokens`, `GET /api/notifications`, `POST /api/notifications/read`, `/sw.js`, `subscribeWebPush()`, `registerNativePush()`, `PushRegistrationBridge`, `EnablePushButton`.

- [ ] **Step 1: Token route** (`src/app/api/notifications/tokens/route.ts`):

```ts
import { NextResponse } from "next/server";

import { currentUserId } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PLATFORMS = new Set(["web", "android", "ios"]);

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token.slice(0, 4096) : "";
  const platform = typeof body.platform === "string" ? body.platform : "";
  if (!token || !PLATFORMS.has(platform)) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }
  const p256dh = typeof body.p256dh === "string" ? body.p256dh.slice(0, 512) : null;
  const auth = typeof body.auth === "string" ? body.auth.slice(0, 512) : null;
  const client = createAdminClient();
  if (client) {
    const { error } = await client.from("notification_tokens").upsert(
      {
        token,
        user_id: userId,
        platform,
        app_id: "flash",
        p256dh,
        auth,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );
    if (error) return NextResponse.json({ error: "Token not saved." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const token = new URL(request.url).searchParams.get("token")?.slice(0, 4096) ?? "";
  const client = createAdminClient();
  if (client && token) {
    await client
      .from("notification_tokens")
      .delete()
      .eq("token", token)
      .eq("user_id", userId);
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: List + read routes**

`src/app/api/notifications/route.ts`:

```ts
import { NextResponse } from "next/server";

import { currentUserId } from "@/lib/auth/server";
import { getPersistedNotifications } from "@/lib/notifications/inbox";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ notifications: [], unreadCount: 0 });
  const items = await getPersistedNotifications();
  return NextResponse.json({
    notifications: items,
    unreadCount: items.filter((item) => !item.read).length,
  });
}
```

`src/app/api/notifications/read/route.ts`:

```ts
import { NextResponse } from "next/server";

import { markPersistedRead } from "@/lib/notifications/inbox";

export async function POST(request: Request) {
  let body: { ids?: unknown; all?: unknown };
  try {
    body = (await request.json()) as { ids?: unknown; all?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const all = body.all === true;
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id): id is string => typeof id === "string" && id.startsWith("ntf:")).map((id) => id.slice(4))
    : [];
  if (!all && !ids.length) return NextResponse.json({ ok: true });
  if (all) {
    const { listNotificationIds } = await import("@/lib/notifications/inbox");
    await markPersistedRead(await listNotificationIds());
  } else {
    await markPersistedRead(ids);
  }
  return NextResponse.json({ ok: true });
}
```

Add `listNotificationIds()` to `inbox.ts`:

```ts
export async function listNotificationIds(): Promise<string[]> {
  const client = createAdminClient();
  if (!client) return [];
  const userId = await currentUserId();
  if (!userId) return [];
  const { data } = await client.from("notifications").select("id").eq("user_id", userId).is("read_at", null);
  return (data ?? []).map((row) => row.id);
}
```

- [ ] **Step 3: Service worker** (`public/sw.js`):

```js
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Flash", {
      body: data.body || "",
      tag: `flash-${data.kind || "notification"}`,
      data: { url: data.url || "/profile/notifications" },
      icon: "/icon.svg",
      badge: "/icon.svg",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/profile/notifications";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((window) => new URL(window.url).origin === self.location.origin);
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      return clients.openWindow(url);
    }),
  );
});
```

- [ ] **Step 4: Browser helpers** (`src/lib/notifications/client.ts`):

```ts
"use client";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(raw);
  return Uint8Array.from([...decoded].map((char) => char.charCodeAt(0)));
}

async function postToken(body: Record<string, unknown>): Promise<void> {
  await fetch("/api/notifications/tokens", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function subscribeWebPush(prompt: boolean): Promise<boolean> {
  if (!publicKey || typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  let permission = Notification.permission;
  if (permission === "default" && prompt) permission = await Notification.requestPermission();
  if (permission !== "granted") return false;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      }));
    const json = subscription.toJSON();
    await postToken({
      token: subscription.endpoint,
      platform: "web",
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    });
    return true;
  } catch (error) {
    console.error("[notifications] web push registration failed", error);
    return false;
  }
}

export async function registerNativePush(): Promise<void> {
  const capacitor = (window as unknown as {
    Capacitor?: { getPlatform?: () => string; Plugins?: Record<string, unknown> };
  }).Capacitor;
  const plugin = capacitor?.Plugins?.PushNotifications as
    | { requestPermission?: () => Promise<unknown>; register?: () => Promise<unknown>; addListener?: (event: string, cb: (data: { token?: string }) => void) => void }
    | undefined;
  if (!plugin || !capacitor?.getPlatform) return;
  const platform = capacitor.getPlatform();
  if (platform !== "android" && platform !== "ios") return;
  try {
    await plugin.requestPermission?.();
    plugin.addListener?.("registration", ({ token }) => {
      if (token) void postToken({ token, platform, appId: "flash" });
    });
    await plugin.register?.();
  } catch (error) {
    console.error("[notifications] native push registration failed", error);
  }
}
```

- [ ] **Step 5: React components**

`src/components/flash/PushRegistrationBridge.tsx`:

```tsx
"use client";

import { useEffect } from "react";

import { registerNativePush, subscribeWebPush } from "@/lib/notifications/client";

export function PushRegistrationBridge() {
  useEffect(() => {
    void registerNativePush();
    void subscribeWebPush(false);
  }, []);
  return null;
}
```

`src/components/flash/EnablePushButton.tsx`:

```tsx
"use client";

import { useState } from "react";

import { subscribeWebPush } from "@/lib/notifications/client";

export function EnablePushButton() {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  return (
    <button
      type="button"
      disabled={state === "working" || state === "done"}
      onClick={async () => {
        setState("working");
        const ok = await subscribeWebPush(true);
        setState(ok ? "done" : "error");
      }}
      className="h-9 rounded-[10px] bg-brand-solid px-3 text-[12.5px] font-semibold text-white disabled:opacity-60"
    >
      {state === "done" ? "Alerts on" : state === "error" ? "Try again" : "Turn on browser alerts"}
    </button>
  );
}
```

Mount `PushRegistrationBridge` in `src/app/layout.tsx` inside `SessionProvider`:

```tsx
import { PushRegistrationBridge } from "@/components/flash/PushRegistrationBridge";
...
<SessionProvider>
  <PushRegistrationBridge />
  {children}
</SessionProvider>
```

- [ ] **Step 6: Typecheck, check, commit**

Run: `npm run typecheck && npm run notifications:check`
Expected: PASS.

```bash
git add src/app/api/notifications src/public/sw.js src/lib/notifications/client.ts src/components/flash/PushRegistrationBridge.tsx src/components/flash/EnablePushButton.tsx src/app/layout.tsx src/lib/notifications/inbox.ts
git commit -m "feat(notifications): add token API, service worker and push registration"
```

---

### Task 6: Wire triggers into writes and completions

**Files:** Modify `src/lib/flash/actions.ts`, `src/lib/payments/service.ts`, `src/lib/flash/repository.ts`.

**Interfaces:**
- Consumes: all semantic helpers from Task 4.
- Produces: notifications emitted for every purchase, booking, new vendor order, new manager sale, payment, delivery completion and dispatch completion.

- [ ] **Step 1: Imports in `src/lib/flash/actions.ts`**

```ts
import {
  notifyCompletion,
  notifyManagerNewSale,
  notifyPurchaseConfirmed,
  notifyVendorNewOrder,
} from "@/lib/notifications/service";
```

- [ ] **Step 2: `bookTicket` — after the `reserve_ticket` succeeds and `total` is computed (before the checkout branch)**

```ts
  const identity = await currentClerkIdentity();
  const eventTitle = (tier.events as unknown as { title?: string } | null)?.title ?? "Event";
  const tierName = tier.name;
  const eventOwnerId =
    (tier.events as unknown as { owner_user_id: string | null } | null)?.owner_user_id ?? null;
  const eventBusinessId =
    (tier.events as unknown as { business_id: string | null } | null)?.business_id ?? null;

  void notifyPurchaseConfirmed({
    userId,
    refType: "ticket",
    refId: id,
    reference,
    total,
    email: { to: identity?.email ?? "" },
  });
  if (eventOwnerId) {
    void notifyManagerNewSale({
      ownerUserId: eventOwnerId,
      businessId: eventBusinessId,
      ticketId: id,
      event: eventTitle,
      tier: tierName,
      quantity,
    });
  }
```

Remove the now-duplicate `const identity = await currentClerkIdentity();` that sits just before the checkout branch (line ~401). Extend the tier select to include `title, business_id`:

```ts
.select("id, name, price, event_id, available, sales_closed, events(owner_user_id, title, business_id)")
```

- [ ] **Step 3: `bookTicketBatch` — inside the loop after each successful reserve**

Keep a small local array of notification payloads and fire them after the loop, or fire immediately. Add `const identity = await currentClerkIdentity();` once before the loop and, after `made.push(id); references.push(reference); total += ...`:

```ts
    const batchEvent = (tier.events as unknown as {
      title?: string;
      owner_user_id?: string | null;
      business_id?: string | null;
    } | null) ?? {};
    void notifyPurchaseConfirmed({
      userId,
      refType: "ticket",
      refId: id,
      reference,
      total: tier.price * line.quantity,
      email: { to: identity.email ?? "" },
    });
    if (batchEvent.owner_user_id) {
      void notifyManagerNewSale({
        ownerUserId: batchEvent.owner_user_id,
        businessId: batchEvent.business_id ?? null,
        ticketId: id,
        event: batchEvent.title ?? "Event",
        tier: tier.name,
        quantity: line.quantity,
      });
    }
```

Extend that route's tier select to `events(owner_user_id, title, business_id)` too. It already declares `const identity` inside the checkout branch — rename that local to `checkoutIdentity` and reuse the earlier one, or simply remove the earlier one and call `currentClerkIdentity()` once at the top of the function.

- [ ] **Step 4: `placeOrder` — extend the restaurant select and fire notifications after the insert**

Change:
```ts
.select("id, name, delivery_fee, distance_km, eta_minutes, discount_percent")
```
to:
```ts
.select("id, name, delivery_fee, distance_km, eta_minutes, discount_percent, owner_user_id, business_id")
```

After `if (error) return …` and before `const total = …`:

```ts
  const orderIdentity = await currentClerkIdentity();
  const itemCount = orderLines.reduce((sum, line) => sum + line.quantity, 0);
  void notifyPurchaseConfirmed({
    userId,
    refType: "order",
    refId: id,
    reference,
    total: subtotal - discount + deliveryFee,
    email: { to: orderIdentity?.email ?? "" },
  });
  if (restaurant.owner_user_id) {
    void notifyVendorNewOrder({
      ownerUserId: restaurant.owner_user_id,
      businessId: restaurant.business_id ?? null,
      orderId: id,
      restaurant: restaurant.name,
      itemCount,
      orderNumber: number,
    });
  }
```

The later `const identity = await currentClerkIdentity();` inside the Paystack branch may stay; it is a second call but harmless. Prefer hoisting it once and reusing.

- [ ] **Step 5: `requestRide` and `sendParcel` — purchase confirmation**

In `requestRide`, after the dispatch handoff (so the real fare is known) and before the checkout:

```ts
  void notifyPurchaseConfirmed({
    userId,
    refType: "ride",
    refId: id,
    reference,
    total: handoff?.fare ?? fare,
    email: { to: identity?.email ?? "" },
  });
```

In `sendParcel`, after the handoff:

```ts
  void notifyPurchaseConfirmed({
    userId,
    refType: "parcel",
    refId: id,
    reference: trackingNumber,
    total: price,
    email: { to: identity?.email ?? "" },
  });
```

Note: driver offers/assignments remain owned by the shared dispatch engine — these lines only notify the customer.

- [ ] **Step 6: `confirmDeliveryAction` — completion**

After a successful `confirmDelivery`:

```ts
  void notifyCompletion({
    userId,
    refType: "order",
    refId: input.orderId,
    reference: input.orderId,
  });
```

- [ ] **Step 7: `src/lib/payments/service.ts` — payment received + completion email**

Add import:
```ts
import { notifyCompletion, notifyPaymentReceived } from "@/lib/notifications/service";
```

Inside `fulfilPayment`, after the payment row is marked `success` and the ticket status update, before payout creation:

```ts
  const refType = payment.order_id ? "order" : payment.ticket_id ? "ticket" : payment.ride_id ? "ride" : "parcel";
  const refId =
    payment.order_id ?? payment.ticket_id ?? payment.ride_id ?? payment.parcel_id ?? payment.id;
  const amountCedis = payment.amount_pesewas / 100;

  void notifyPaymentReceived({
    userId: payment.user_id,
    refType,
    refId,
    total: amountCedis,
    reference,
  });

  if (refType === "ticket" || refType === "ride" || refType === "parcel") {
    void notifyCompletion({ userId: payment.user_id, refType, refId, reference });
  }
```

The order completion email fires on `confirmDeliveryAction` (Step 6); this avoids promising completion before the customer has the order.

- [ ] **Step 8: `src/lib/flash/repository.ts` — dispatch completion**

Inside `syncDispatchRows`, after the row update when `canonicalState(patch.dispatch_task_status) === "delivered"`:

```ts
        const { data: booking } = await client
          .from(table)
          .select("user_id, reference, tracking_number")
          .eq("id", row.id)
          .maybeSingle();
        if (booking) {
          void notifyCompletion({
            userId: booking.user_id,
            refType: kind,
            refId: row.id,
            reference: booking.reference ?? booking.tracking_number ?? row.id,
          });
        }
```

Add the import at the top of the file:
```ts
import { notifyCompletion } from "@/lib/notifications/service";
```

- [ ] **Step 9: Verify and commit**

Run: `npm run typecheck && npm run notifications:check`
Expected: PASS.

```bash
git add src/lib/flash/actions.ts src/lib/payments/service.ts src/lib/flash/repository.ts
git commit -m "feat(notifications): wire purchase, order, manager and completion triggers"
```

---

### Task 7: Customer inbox and business console views

**Files:** Modify `src/lib/flash/notifications.ts`, `src/lib/flash/profile-actions.ts`, `src/components/dashboard/NotificationInbox.tsx`, `src/components/dashboard/ConsoleTopbar.tsx`, `src/app/(app)/profile/notifications/page.tsx`; create `src/app/(console)/dashboard/notifications/page.tsx`.

**Interfaces:**
- Consumes: `getPersistedNotifications()`, `getBusinessNotifications()`, `getBusinessUnreadCount()`, `markPersistedRead()`.
- Produces: merged customer inbox, scoped business inbox, bell with unread count.

- [ ] **Step 1: Merge persisted events into `src/lib/flash/notifications.ts`**

Add import:
```ts
import { getPersistedNotifications } from "@/lib/notifications/inbox";
```

In `getNotifications()`, include the persisted read alongside the other reads:
```ts
  const [tickets, order, businesses, payments, seen, persisted] = await Promise.all([
    listTickets(),
    getActiveOrder(),
    listBusinesses(),
    listUserPayments(),
    readKeys(userId),
    getPersistedNotifications(),
  ]);
```

Change the array declaration to include persisted items:
```ts
  const items: Omit<AppNotification, "read">[] = persisted.map((item) => ({
    key: item.key,
    title: item.title,
    detail: item.detail,
    at: item.at,
    href: item.href,
  }));
```

Keep the existing `for … items.push(...)` blocks appending to that array. The final `.map((item) => ({ ...item, read: seen.has(item.key) }))` must be replaced with:

```ts
  const seenPersisted = new Map(persisted.map((item) => [item.key, item.read]));
  const result = items
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((item) => ({
      ...item,
      read: item.key.startsWith("ntf:")
        ? (seenPersisted.get(item.key) ?? false)
        : seen.has(item.key),
    }));
```

- [ ] **Step 2: Handle persisted keys in `markNotificationsRead`**

In `src/lib/flash/profile-actions.ts`, add import:
```ts
import { markPersistedRead } from "@/lib/notifications/inbox";
```

Inside `markNotificationsRead`, before the `client` null-check:
```ts
  const persisted = valid
    .filter((key) => key.startsWith("ntf:"))
    .map((key) => key.slice(4));
  const derived = valid.filter((key) => !key.startsWith("ntf:"));
  await markPersistedRead(persisted);
```

Then replace `valid` with `derived` in the rest of the function (the demo `forEach`, the `upsert` map, and the early `if (!valid.length) return { ok: true };` must become `if (!derived.length && !persisted.length) return { ok: true };`).

- [ ] **Step 3: Show the kind in the inbox (status is never colour alone)**

In `src/components/dashboard/NotificationInbox.tsx`, add `kind?: string` to the imported `AppNotification` usage via the type in `notifications.ts` (add `kind?: string` there), and render a small label line after the title:

```tsx
                    {item.kind ? (
                      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-ink">
                        {item.kind.replace(/_/g, " ")}
                      </p>
                    ) : null}
```

- [ ] **Step 4: Add the browser opt-in to the customer page**

In `src/app/(app)/profile/notifications/page.tsx`, import `EnablePushButton` and render it under the preference:

```tsx
      <div className="mt-3">
        <EnablePushButton />
      </div>
```

- [ ] **Step 5: Business notifications page**

Create `src/app/(console)/dashboard/notifications/page.tsx`:

```tsx
import type { Metadata } from "next";

import { NotificationInbox } from "@/components/dashboard/NotificationInbox";
import { getBusinessNotifications } from "@/lib/notifications/inbox";

export const metadata: Metadata = { title: "Business notifications" };
export const dynamic = "force-dynamic";

export default async function BusinessNotificationsPage() {
  const items = await getBusinessNotifications();
  return (
    <>
      <h1 className="text-[22px] font-bold tracking-[-0.02em] text-ink">Notifications</h1>
      <p className="mt-1 text-[13px] text-muted">
        New orders and ticket sales across your businesses.
      </p>
      <NotificationInbox items={items} />
    </>
  );
}
```

- [ ] **Step 6: Bell in the console top bar**

In `src/components/dashboard/ConsoleTopbar.tsx`, add imports:
```tsx
import Link from "next/link";
import { Icon } from "@/components/flash/Icon";
import { getBusinessUnreadCount } from "@/lib/notifications/inbox";
```

In the component body:
```tsx
  const unread = await getBusinessUnreadCount();
```

Add this link inside the `flex shrink-0 items-center gap-1.5` div, before the mobile nav:
```tsx
        <Link
          href="/dashboard/notifications"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-icon-idle"
        >
          <Icon name="bell" size={18} />
          {unread ? (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-solid px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Link>
```

- [ ] **Step 7: Verify and commit**

Run: `npm run typecheck && npm run check`
Expected: PASS.

```bash
git add src/lib/flash/notifications.ts src/lib/flash/profile-actions.ts src/components/dashboard/NotificationInbox.tsx src/components/dashboard/ConsoleTopbar.tsx src/app/\(app\)/profile/notifications/page.tsx src/app/\(console\)/dashboard/notifications/page.tsx
git commit -m "feat(notifications): add customer and business notification views"
```

---

### Task 8: Full verification

- [ ] **Step 1: Run every gate from the final tree**

```bash
npm run check
npm run build
npm run db:check
npm run media:check
npm run notifications:check
npx vitest run
```

Expected: all pass, no type or lint errors, schema mirror current, seed matches migration.

- [ ] **Step 2: Review the diff**

Run: `git status && git diff --stat && git log --oneline -10`
Expected: only intended files changed; no secrets or `.env.local` staged.

- [ ] **Step 3: Report**

Summarise delivered behaviour, config required to go live (VAPID keys, FCM service account, Resend key/sender), and explicitly list what was not exercised (live FCM/Resend/VAPID delivery, native Capacitor UI — another branch).
