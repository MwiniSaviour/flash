# Flash — surface brief: the app shell and the home blend

Scope: the whole Flash client (Next.js App Router, mobile-first web with a desktop
layout), anchored on the home screen.

Visitor mode: **Operate.** The visitor came to get a job done — book a ticket, a
ride or a meal. The screen is first a working product of its category; the world
serves the task.

Audience and job: an urban Ghanaian consumer on a phone in the evening, moving
between three services in one hour (something happening → a ticket → a ride to
it → dinner afterwards).

Constraints: the reference app's design language is the binding visual authority
(its own tokens in `src/app/globals.css`, its icon set, its component idioms);
the reference's radio broadcasting subject is not carried over; no payment
provider, backend or live feed exists yet, so no surface may imply one.

## Direction contract

**THESIS:** Flash's home is a blend, not a menu of service links — one feed that
carries events, rides and food at the same time. It takes the reference app's
radio-home composition (media hero → Up Next rail → Upcoming Events → Trending
Now) and re-points it at three urban services. It refuses the category default
of five tabs that each lead to an unrelated vertical.

**OWN-WORLD:** Warm off-white ground (#f7f5f1), one saturated broadcast orange
(#fc5303) marking every primary action and every active state, near-black ink
(#14120f), white cards with hairline borders and soft offset shadows, Inter for
every word, and the five-bar pulse mark drawn in SVG as the brand's only
graphic — inherited from the reference app's waveform and re-pointed at speed.

**STORY:** A person opens Flash on a Friday evening and sees what is trending
tonight, what is next in each of the three services, the next event and its
price, what is trending to eat, and a ride brief — then books any of them in two
taps.

**FIRST VIEWPORT:** Brand header (mark, search, account) → a full-bleed media
hero running a five-item slideshow of trending events and food, scrim, headline,
price and a round orange action → the "Up Next" rail: four square artwork tiles,
one per service.

**FORM:** The reference app's radio-home composition, re-pointed at three urban
services. Mobile: one column, 20px gutter, 390pt frame, five-item bottom tab
bar with no profile. Desktop: left navigation rail, central column, right rail —
the social-app idiom, never a stretched phone frame.

**SEED KEY:** none — this world was inherited from the supplied reference
implementation and its screenshots rather than rolled by `concept-seed` (that
script does not ship with the installed Impeccable binary, which offers only
`detect`, `ignores`, `help`, `install`, `link`, `update` and `check`).

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance.

## Unresolved decisions

- Payment rails (Mobile Money vs card) are chosen in the UI but no provider is
  connected; the surfaces say so.
- Whether the account surface stays outside the bottom navigation, and where it
  lives on the desktop rail.
- Live ride tracking and order-status tracking behaviour.
