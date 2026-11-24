# Production database and live tracking wiring — design

Date: 2026-11-24
Status: approved for implementation (security-first addendum to the approved
`2026-11-24-production-catalogue-sellers-design.md`)

## Goal

Make Flash read and write real database rows, and make booking/Track and driver
assignment update live, using the existing VPS Postgres/PostgREST stack with a
signed service-role JWT. No secret reaches the browser, and no screen silently
invents data.

## Relationship to the approved plan

This is an additive security and transport design for the approved production
catalogue/sellers plan. It does not replace any task in that plan. Where the
plan says "database configuration is mandatory", this document defines how the
credentials are supplied and how live updates reach a browser without giving
the browser database credentials.

## Architecture

- **Data plane.** `NEXT_PUBLIC_SUPABASE_URL` points at the Supabase-shaped
  endpoint (locally the `ops/flash/proxy.mjs` prefix at `127.0.0.1:3002`;
  in production an operator-supplied HTTPS URL). The browser receives only
  that URL and the anon key. `SUPABASE_SERVICE_ROLE_KEY` is consumed only by
  `src/lib/supabase/admin.ts`, which is guarded with `server-only`.
- **Signed role tokens.** The VPS PostgREST instance trusts JWTs signed with
  `PGRST_JWT_SECRET`. The anon token carries `role: "anon"`; the server token
  carries `role: "service_role"`. Both are injected from the environment;
  neither is committed. The service-role token bypasses RLS, so every query
  is scoped to the signed-in Clerk user in the repository or action.
- **Live transport.** The VPS stack has no Supabase Realtime gateway, so
  browser `postgres_changes` channels cannot work. A Next route handler owns a
  server-sent events (SSE) stream. It authenticates the Clerk session on the
  server, uses the service role to read only rows belonging to that user, and
  emits a coarse `refresh` event when a digest of those rows changes. It never
  streams row data. Existing `useLiveRefresh` polling remains the fallback.
- **Driver assignment.** The same stream carries task-state digests for rows
  tied to the signed-in driver, so offer/accept/delivery changes refresh the
  assignment screens without exposing other drivers' work.

## Components

- `src/lib/env.ts`: `assertProductionEnv()` plus a dedicated live-config check.
- `src/lib/supabase/admin.ts`: unchanged server-only boundary; rejects missing
  URL/key with an actionable error.
- `src/app/api/live/route.ts`: authenticated SSE endpoint.
- `src/lib/live/stream.ts`: server-only digest builder over scoped queries.
- `src/lib/live/client.ts`: browser `EventSource` lifecycle hook.
- `src/lib/flash/use-live-tracking.ts` and `src/lib/use-live-refresh.ts`:
  subscribe to the SSE stream and fall back to the existing interval.
- `ops/flash/*`: unchanged except for documenting the production HTTPS URL and
  JWT-secret requirement.

## Data flow

1. Browser opens `/api/live` with the Clerk session cookie.
2. Route verifies the session server-side; unauthenticated requests get 401.
3. Server builds a per-user digest from only the rows the user may see. No
   customer PII, row contents or provider tokens are placed in the event.
4. On change, the route sends `event: refresh\ndata: {}\n\n`. Clients call
   `router.refresh()`; the server-rendered page re-reads through the repository.
5. If SSE errors or times out, clients return to the 15-second polling fallback.

## Security requirements (priority)

- No secret in `NEXT_PUBLIC_*`, logs, error messages, source or commits. The
  service-role key is read only in server-only modules.
- SSE requires a verified Clerk session for every connection and on every
  re-validation tick; a revoked session stops receiving events.
- Authorization is server-side and per user; the client cannot name an
  arbitrary user id, order id or driver id to widen the stream.
- Events contain no row bodies, PII, DB errors or token material.
- Responses set `Cache-Control: no-store, no-transform`, `X-Accel-Buffering:
  no`, and `Content-Type: text/event-stream`; no permissive CORS.
- Digest computation uses a keyed hash (HMAC with a server-only secret derived
  from the environment), not an unkeyed hash of raw row data.
- Polling cadence is bounded and stops when the tab is hidden; each connection
  has a server-side deadline. The endpoint is not an unauthenticated polling
  amplifier.
- Configuration failures are loud: missing DB/Clerk credentials fail the
  production path; no fixture fallback is presented as real data.
- Cloudinary and seller-provisioning scripts refuse to run without credentials
  and never print secrets, emails or tokens.

## Error handling

- Missing DB config: `assertProductionEnv()` throws with missing key names only.
- Unauthenticated/forbidden SSE: 401/403 with no body details.
- Upstream DB failure: log a non-PII correlation id, keep the stream open for a
  bounded retry window, then close so the client falls back to polling.
- Malformed or expired signed JWT: admin client construction fails closed.

## Testing

- Unit tests for `assertProductionEnv()` with `vi.stubEnv`.
- Unit tests for the SSE digest: same rows produce the same digest, a changed
  scoped row produces a new digest, and a different user's row does not.
- Route tests for unauthenticated 401, authenticated stream headers, and
  no row data in the event body.
- Existing plan tests for repository/actions/ownership/media/tracking states.
- Final checks: `npm run check`, `npm run build`, `npm run db:check`,
  `npm run media:check`, and the production smoke checklist.

## Non-goals

- No Supabase cloud project, no Supabase Realtime websocket gateway on the VPS.
- No new payment provider, no second accent colour or typeface.
- No committed credentials, no fixture rows presented as production data.
