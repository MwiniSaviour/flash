# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + Tailwind CSS + Supabase (backend later) + Clerk (auth later). This pass is UI/UX only: every screen is built against typed demo data shaped like the Supabase schema so the backend swaps in without reshaping screens. Clerk session state is expected to back the signed-in surfaces but is stubbed in this pass.

## Users

Primary user: an urban Ghanaian consumer (Accra and the Greater Accra area) on a phone, moving through a busy evening. They are booking event tickets, a ride to get somewhere, and food — often in the same hour, often from the same app. The reference product's surfaces (Ghana cedi pricing, venues such as Labadi Beach, Trade Fair Centre and Alliance Française, Accra neighborhoods) evidence the market and the register of the content.

Secondary consideration: the same user on a desktop browser, where the product must not read as a stretched phone app.

## Product Purpose

**Flash** is one app for three urban services: booking event tickets, booking a ride, and ordering food. The name carries the promise — speed of delivery — and it is the organizing idea of the product, not decoration.

Success means the user can, in a single session on a phone: find something happening tonight, get a ticket, get a ride to it, and have food waiting when they arrive — without re-orienting in a different mental model for each service.

## Positioning

The mechanism is a single blended surface: one home feed that mixes event discovery, ride action and food, over one account, with the same ticketing, booking and ordering primitives underneath. A neighboring product could ship a ticketing app, a ride-hailing app or a food app individually; what it cannot truthfully copy is one home screen that carries all three live at once, and one bookings record that holds all three kinds of commitment.

## Operating Context

- The user is standing, commuting or waiting — one-handed phone use, bright daylight or dim evening, often on mobile data.
- Booking a ride is time-critical and location-sensitive; the ride surface is a decision surface, not a browsing surface.
- Food ordering is repeatable and habitual; the food surface is a re-order and browse surface.
- Event ticketing is considered, low-frequency, and forward-looking; the tickets surface is a wallet of future commitments.
- Event discovery in this market leans on recommendation: what is trending, what is nearby, what is worth leaving the house for.

## Capabilities and Constraints

Confirmed:

- Five primary destinations on the phone: **Home, Events, Ride, Food, Track**, with the ride button raised out of the middle of the phone's bottom bar.
- **Food took the Bookings slot.** Ordering a meal is one of the three things Flash does, so it earns a tab rather than a dig. Bookings gave the slot up: the ledger is a record of what the customer already committed to, so it lives in the profile beside the account, and the desktop rail keeps it for convenience.
- The fifth destination was named "Activities" in the original brief and renamed during init to **Bookings** — it records the user's booked services (ride bookings, food orders, ticket purchases), not "activities" in the leisure sense.
- **Track** (the fifth destination) is the delivery surface: what is on its way to the user — food orders, rides in progress and parcels — each with its number, its stage, its ETA and its position on the route diagram. Each card opens the delivery's own page.
- **Parcels are a service of their own.** The user can send a parcel (pick-up, drop-off, what is inside, how big it is) as well as receive one.
- No profile entry point in the bottom navigation.
- Every booking produces **proof**: an event pass, an order receipt, a ride confirmation and a parcel receipt, each carrying a scannable QR of the booking reference, the facts a gate or a rider will check, and share and print actions.
- Home uses the reference app's radio-style information architecture, re-purposed: a five-item slideshow banner of trending events and trending food, a horizontal "Up Next" rail, an "Upcoming Events" section, and a "Trending Now" section. Home briefs all the services.
- Events keeps the reference product's structure: search, category filter chips, a featured event, and an upcoming-events list.
- **Food follows the reference food app's structure**: search, cuisine chips, then two card rails — the kitchens near you and the kitchens Flash is moving most — with the rating on the photograph, the delivery charge and the ready time under the name, and a "View all" that opens the full list.
- **A dish is ordered, not just added.** The dish page takes the kitchen's banner, names the portion, offers the extras the kitchen actually adds, and carries a quantity stepper and one "Add to cart" button.
- **An order can be collected.** The customer chooses delivered, picked up or eaten in. Collecting costs nothing, because nobody rides anywhere.
- **The delivery charge depends on the distance.** A kitchen's base fee covers the first few kilometres across Accra; beyond that the customer pays per kilometre.
- **A kitchen owner gets a storefront to look after**: the cover their customers see, and a printable poster with a real code that opens the kitchen on a phone.
- Bookings keeps the ledger and holds the event ticket wallet under its "Tickets" filter.
- Booking a ticket, booking a ride, ordering food and sending a parcel each have a complete flow ending in a confirmation.
- Mobile layout presents as a native mobile app: bottom tab bar, single column, thumb-reachable actions.
- Desktop layout presents in the social-app idiom the user named: a persistent left navigation rail, a central content column, and a right-hand rail — not a stretched phone frame.
- Currency is the Ghana cedi (GHC), as evidenced by the reference product.
- Demo data is synthetic but realistic: real-looking event names, venues, restaurants, ride classes, parcels, fares and names. It is labeled as demo data on every surface that shows a price, a rating or a reference, and must be replaceable by Supabase reads without layout change.

Explicitly undecided:

- Payment method (mobile money vs card vs cash) is not yet confirmed for tickets, rides, food or parcels. No payment provider is connected, so no screen charges a service fee or takes money.
- Ratings and reviews (for restaurants, drivers, events) are not confirmed as product surfaces.
- Whether the account/profile surface exists outside the bottom nav, and where it lives.
- Live ride tracking and order-status tracking behavior: the surfaces show modelled progress; the real feed arrives with the backend.

## Brand Commitments

- **Name: Flash.** The name means speed of delivery and is the product's organizing promise.
- **Design language: inherited from the reference product.** The four reference screenshots (Prototype Radio — Home, Events, My Tickets, Profile) are the binding visual authority: warm off-white ground, one vivid orange accent used for primary action and active state, near-black display type, white rounded cards with a hairline border, pill chips, square date badges, and a bottom tab bar with an orange active state. The same language governs Ride, Track, Food, Parcels, Bookings and the desktop layout.
- No radio broadcasting content: the reference's radio subject is replaced by the services above. The reference's *layout* is the borrowing, not its content.

## Evidence on Hand

- `Screenshot_20261115-214740.jpg` — Events screen (search, category chips, featured event, upcoming events, tab bar).
- `Screenshot_20261115-214748.jpg` — My Tickets screen (segmented control, ticket cards, confirmed badges, tab bar).
- `Screenshot_20261115-214756.jpg` — Profile screen (avatar, stats row, settings list, notification toggle).
- `Screenshot_20261115-223918.jpg` — Home screen (radio hero, Up Next rail, Upcoming Events, tab bar).

No real inventory, pricing, vendor or customer data exists. Every price, vendor, event, driver, restaurant and rating shown in this build is synthetic demo content and must not be presented to users as fact.

## Product Principles

1. **One motion, four services.** Home is a blend, not a menu of links; a user should grasp the whole product in one screen.
2. **Booking is the unit of value.** The app is measured in tickets bought, rides taken, parcels sent and meals delivered — every surface ends in one of those commitments.
3. **Speed is the promise.** Latency, clarity of the next action and fewer taps outrank feature breadth.
4. **One visual language, four services.** Ride, food, parcels and events look like one product, not four reskins.
5. **Demo data must die quietly.** Seeded content is shaped like the real schema so it can be swapped for live Supabase reads with no visible rework.

## Accessibility & Inclusion

- Minimum 44×44px touch targets for every primary action; bottom-nav items included.
- Body text meets WCAG AA contrast on the off-white ground and on orange fills.
- Status is never color-only: confirmed/pending/cancelled states carry an icon and a label.
- All imagery carries descriptive alt text; date badges expose full dates to assistive tech.
