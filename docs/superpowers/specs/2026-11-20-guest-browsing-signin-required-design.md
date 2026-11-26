# Guest browsing with sign-in required for commitments — design

Date: 2026-11-20
Status: approved for implementation

## Goal

Anyone can browse ScalDive: home, search, event and kitchen detail, ride quote and
parcel quote. The moment a visitor shows buy intent — adding to a cart, opening
a booking sheet, asking for a sold-out place, paying or placing an order — they
are asked to sign in and returned to the page they came from.

Out of scope: changing browsing reads, payment provider work, admin changes.

## Decisions

- **Guest = Clerk configured and no signed-in user.** `useSession()` reports
  `{ user: null, loading: false, demo: false }`. Keyless fixture mode keeps the
  demo customer and is unaffected, so all local flows keep working.
- **One client gate.** `SignInGate` wraps buy-intent controls. For a guest it
  renders a "Sign in to continue" control linking to
  `/sign-in?redirect_url=<current path>`; otherwise it renders the real control
  untouched. No per-feature auth logic is duplicated.
- **Gate at every buy-intent click**, not only at final payment: "Add to cart",
  "Proceed to checkout", "Ask for a place", ride/parcel booking-sheet openers,
  and every final commit action (Pay, Place order, Request ride, Send parcel,
  Confirm delivery). Final commits already have server guards; the gate improves
  the guest experience without replacing them.
- **Guest chrome.** The avatar/name in the desktop rail, top bar and mobile
  header becomes a "Sign in" action for guests. A signed-out visitor is never
  shown the demo customer's identity.
- **Server remains authoritative.** All purchase actions guard on
  `currentUserId()` before any write. `requestTickets` currently inserts a null
  user and gets the missing guard. In keyless mode the demo id is returned, so
  guards stay no-ops there by design.
- **Safe return.** The sign-in page validates `redirect_url` as a local path:
  it must start with `/`, not `//`, and contain no scheme or host. Off-host or
  malformed values fall back to `/`. The admin host keeps its own routing.

## Components

- `src/components/auth/SignInGate.tsx` — client wrapper, uses `useSession()`
  and `usePathname()`.
- `src/components/auth/AccountControl.tsx` — client avatar-or-sign-in control
  reused by `SideRail`, `TopBar` and the mobile header.
- `src/app/sign-in/page.tsx` — reads `searchParams`, passes a validated return
  path to Clerk's `<SignIn />`.

## Verification

`npm run check`, `npm run build`, `npm run db:check`, `npm run media:check`,
Impeccable detector on changed UI files, and Playwright: a signed-out visitor
can browse catalog pages; each buy-intent control routes to sign-in and returns
to the original page after sign-in; the server rejects a direct action call
from a guest.
