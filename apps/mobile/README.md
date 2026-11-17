# Prototype Radio — mobile app (Capacitor)

A Capacitor shell around a Vite + React + Tailwind bundle. It runs in the browser
during development and ships to iOS and Android from the same bundle.

The tab bar is **Home · News · Events · Tickets · Profile**.

| Screen | Route | File |
| --- | --- | --- |
| Onboarding | `/welcome` | `src/screens/OnboardingScreen.tsx` |
| Home | `/` | `src/screens/HomeScreen.tsx` |
| News | `/news` | `src/screens/NewsScreen.tsx` |
| Story reader | `/news/:slug` | `src/screens/ArticleScreen.tsx` |
| Live Radio (broadcast schedule) | `/live` | `src/screens/LiveScreen.tsx` |
| Full week schedule | `/live/schedule` | `src/screens/ScheduleScreen.tsx` |
| Events | `/explore` | `src/screens/ExploreScreen.tsx` |
| My Tickets | `/tickets` | `src/screens/TicketsScreen.tsx` |
| Event detail | `/events/:slug` | `src/screens/EventDetailScreen.tsx` |
| Profile | `/profile` | `src/screens/ProfileScreen.tsx` |

**Live Radio is a nested page, not a tab.** It opens from the Home "Up Next"
rail (its See All sends you there too) and pushes over the tab bar with its own
back affordance, the same way a story reader and the event detail page do.

`/live` is the **broadcast schedule**, not a station dial:

- the banner carries whatever is on air right now — or, between programmes, the
  next broadcast, flagged "Starts soon" — with the station's live stream on the
  play button;
- **Today's Schedule** lists the day in time order, using the same row design as
  the old All Stations list, with the station tile art leading each programme;
- **View all** opens `/live/schedule`, the whole week grouped by day, still with
  the station artwork on every row.

Home's "Up Next" rail shows exactly **three** programmes in a fixed grid, with no
horizontal scroller, using the dial's tile art (waveform, Urban Radio, Highlife
Classics).

### One station

The app is built around **one** station, Prototype FM (`src/data/stations.ts`).
The payload, player, schedule and profile all resolve through that list, so there
is no dial of stations the app does not carry. Consequences:

- `Live Radio` names the station and its broadcast count, not "4 stations";
- Profile's third tile counts **saved items** rather than stations, and account →
  **Favorites** lists them (see below);
- the seed deletes any station documents left over from an earlier seed.

### Favorites

`ContentProvider` + `FavoritesProvider` split the two kinds of state: content
comes from the CMS (fixtures are the offline cache), while saves live on the
device under `prototype-radio-favorites-v1` — the same convention as the wallet.
A favorite is only a `{ kind, slug }` pointer, resolved against the shared
fixtures at render time, so nothing is duplicated.

- Save from the reader (heart in the header) or the event page (heart over the
  artwork); the filled heart is a solid glyph.
- Profile's **Favorites** tile and menu row both read the same count, so saving
  anything increments it immediately.
- `/profile/favorites` lists stories and events together, newest first, each with
  a one-tap remove. `/profile/stations` (the old address) resolves to it.

### Builder credit

Every profile screen — Profile, My Events, Favorites, Notifications, Settings,
Help & Support — and My Tickets ends in `ScalmintFooter`: **Powered by Scalmint**
(links to https://scalmint.com, new tab) above **Contact 052703858** (a `tel:`
link).

### No per-row play buttons

The live stream is one continuous feed, so a schedule row is only ever a listing.
The single play action lives in the Live Radio banner; rows carry artwork, slot,
programme and presenter. Nothing in the app offers playback it cannot deliver.

### No simulated status bar

The OS owns the status strip. The app draws no clock, notch or battery glyph; it
pads with `safe-area-inset-top` and lets the real system bar sit over the page
(`--color-paper` ground, so the glyphs stay legible).

## One content source

Nothing is duplicated from the web app. The app reads the same monorepo content:

- **Live data** — `src/lib/api.ts` calls the repo's own Payload CMS
  (`/api/stations`, `/api/events`, `/api/tickets`, `/api/listeners`). Those
  collections are defined in `src/collections/` at the repo root and filled by
  `npm run seed`.
- **Fixtures** — programmes, presenters, articles and cover art come from
  `src/data/*` via the `@shared` alias (the same files the web build imports).
  The newsroom screen derives its lead carousel, breaking strip and "The latest"
  list from `src/data/articles.ts` in `src/lib/news.ts`; the Home "Up Next" rail
  derives the next broadcasts from each show's own schedule in
  `src/lib/schedule.ts` — no second copy of either.
- **Images** — every photograph and logo is served from the repo's
  `public/assets/images/`, mounted as Vite's `publicDir`. There is no second copy
  anywhere in `apps/mobile`.

If the CMS is unreachable the app falls back to the same seed data, and the
Profile → Settings row reports which source is live ("Payload CMS" or "Seeded
fixtures").

## Develop

```bash
# from the repo root, with the CMS up on :3000
npm run seed            # once, fills Postgres with the shared content
cd apps/mobile
npm install
npm run dev             # http://127.0.0.1:5173
```

Vite proxies `/api`, `/media` and `/admin` to the CMS. `/assets` is **not**
proxied — the dev server serves those files itself, which is also what happens on
a device.

`VITE_API_URL` overrides the API origin for a native build (point it at the
deployed CMS; on device there is no localhost proxy).

## Ship

```bash
npm run build           # tsc + vite build -> dist/
npm run sync            # build, then `cap sync` into the native projects
npm run ios / android   # open the native IDE
```

`capacitor.config.ts` holds the app id (`com.pulseradio.app`), the warm-white
background and the status-bar/keyboard plugins. Create the platform folders once
on a machine with the toolchains installed (`npx cap add ios` / `npx cap add
android`); they are not checked in.

## Design system

Tokens live in `src/styles/app.css` as a Tailwind v4 `@theme` block — orange
brand `#FC5303`, warm-white paper `#F6F3EF`, near-black ink, hairline `#E9E6E0`.
They are deliberately separate from the web app's red brand tokens.

The newsroom uses the same brand orange for its kickers, breaking flag and
carousel dots — one accent across the app — with an editorial serif
(`--font-display`, Playfair Display) for headlines only. Everything else stays on
Inter.

Screen gutters are 20 px, cards are white with a hairline border and 13–14 px
radius, and the tab bar is 60 px with 21 px icons above 10 px labels. Icons are
inline SVG in `src/components/ui/Icon.tsx` (no icon font, no sprite request), so
the bundle works offline.

## Accessibility

Each screen exposes an `h1` (visually hidden where the mock has no visible page
title), the tab bar is a `<nav>` of links with `aria-current`, the ticket
segmented control is a real tablist, and the notification switch is a styled
checkbox rather than a clickable div. A single polite live region in `App.tsx`
announces playback and checkout, so state changes are not silent.
