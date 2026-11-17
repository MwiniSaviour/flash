# Asset Provenance — Flash (interface prototype)

Every file under `public/assets/` is catalogued below with its origin and licence
status. This is a **local UI prototype**. Nothing here is cleared for public
commercial release; the legal notes at the bottom are load-bearing.

---

## Summary

| Class | Count | Origin | Licence status |
|---|---|---|---|
| Brand mark | 1 (inline SVG + `src/app/icon.svg`) | Drawn for this project | **Owned by this project.** |
| Event photography (`images/event-*`) | 9 | Carried over from the reference app's research pass; 4 newly sourced from Unsplash | **Unverified (carried over) / Unsplash licence (new).** See §2. |
| Food & restaurant photography (`images/dish-*`, `images/restaurant-*`) | 10 | Unsplash | **Unsplash licence — free to use, attribution appreciated.** |
| Ride photography (`images/ride-*`) | 3 | Unsplash | **Unsplash licence.** |
| Portrait photography (`images/avatar-*`) | 11 | Open portrait libraries, carried over from the reference app | **Unverified — prototype only.** |
| Line icons | — | Lucide (npm), rendered inline as SVG | **ISC licence.** Owned by the project in use. |

Total files under `public/`: **33**.

---

## 1. Brand identity (owned)

| File | Source | Notes |
|---|---|---|
| `src/components/flash/FlashLogo.tsx` | Drawn for this project | The five-bar pulse mark and the FLASH / ACCRA lock-up. Inline SVG, so it stays crisp at every density and can flip to white over imagery. |
| `src/app/icon.svg` | Drawn for this project | The same mark as the app icon. |

The reference repository shipped the *Radio Waa* wordmark, icon set and PWA
icons under `public/assets/logo/`. Those were removed when the project was
rebranded: they are another broadcaster's trade dress and are not licensed for
reuse. Nothing from that folder survived into Flash.

---

## 2. Event photography (`images/event-*`)

Carried over from the reference app, which sourced them from a web image search
of Ghanaian news outlets and open photo libraries, cropped with ImageMagick and
renamed to what they depict:

| File | Subject |
|---|---|
| `event-sunset-live.jpg` | A crowd with raised hands in front of a lit stage at sunset |
| `event-afrobeats-zone.jpg` | A crowd dancing under purple club lights |
| `event-comedy-night.jpg` | A comedian at the microphone under a warm spotlight |
| `event-highlife-night.jpg` | A live band playing under stage lights |
| `event-urban-vibes.jpg` | Festival-goers in front of an illuminated main stage |

Newly sourced for Flash from Unsplash, each checked by eye before use:

| File | Subject | Unsplash photo id |
|---|---|---|
| `event-concert-crowd.jpg` | A festival crowd with raised arms under orange stage lights | `photo-1502680390469-be75c86b636f` |
| `event-wellness.jpg` | A person meditating in silhouette at sunrise between palm trees | `photo-1506126613408-eca07ce68773` |
| `event-football.jpg` | A football boot resting on a match ball | `photo-1579952363873-27f3bade9f55` |
| `event-nightclub.jpg` | A nightclub crowd with raised hands in front of a DJ booth | `photo-1516450360452-9312f5e86fc7` |

> **Attribution for the carried-over set is approximate.** They came from a
> search index rather than a licence purchase, so per-file credit and rights
> are **not established**.

> **Action before any real deployment:** replace every photograph here with
> licensed stock or brand-owned photography, or verify each file's licence
> individually. Do not publish this set.

---

## 3. Food and restaurant photography (`images/dish-*`, `images/restaurant-*`)

Sourced from Unsplash for this project, each opened and checked before it was
given a name — a file is named after what is actually in the frame, and every
alt text in the fixtures describes that frame rather than the dish name beside
it.

| File | Subject | Unsplash photo id |
|---|---|---|
| `dish-fried-rice.jpg` | Fried rice with chicken, sweetcorn and spring onion | `photo-1603133872878-684f208fb84b` |
| `dish-prawn-stew.jpg` | Prawns in a brown stew with white rice and coriander | `photo-1559847844-5315695dadae` |
| `dish-bbq.jpg` | Grilled meat skewers with peppers and dipping sauces | `photo-1555939594-58d7cb561ad1` |
| `dish-burger.jpg` | A double cheeseburger with pickles and tomato | `photo-1568901346375-23c9450c58cd` |
| `dish-pizza.jpg` | A thin-crust pizza with chicken and pineapple on a board | `photo-1565299624946-b28f40a0ae38` |
| `dish-loaded-fries.jpg` | Loaded sweet potato fries with guacamole and sour cream | `photo-1543353071-10c8ba85a904` |
| `dish-brunch-spread.jpg` | A table spread of brunch plates, avocado toast and juice | `photo-1533777324565-a040eb52facd` |
| `dish-plated-mains.jpg` | Three plated dishes on dark ceramic plates | `photo-1504674900247-0877df9cc836` |
| `restaurant-interior.jpg` | A modern dining room set with dark leather seating | `photo-1517248135467-4c7edcad34c4` |
| `restaurant-table-service.jpg` | A plated fish dish served at a table set with wine glasses | `photo-1414235077428-338989a2e8c0` |

The Unsplash licence covers this use. The photographs show food that is not
Ghanaian — the fixtures name dishes the closest honest match, and the alt text
describes the plate rather than the menu item.

---

## 4. Ride photography (`images/ride-*`)

| File | Subject | Unsplash photo id |
|---|---|---|
| `ride-driver-pov.jpg` | A driver's hands on the steering wheel at dusk | `photo-1449965408869-eaa3f722e40d` |
| `ride-bike-sunset.jpg` | A motorcyclist riding at sunset on an open road | `photo-1558981806-ec527fa84c39` |
| `ride-xl-coach.jpg` | A coach bus with its lights on at dusk | `photo-1544620347-c4fd4a3d5957` |

---

## 5. Portrait photography (`images/avatar-*`)

Eleven stock portraits carried over from the reference app, used for the
customer, the riders and the kitchen staff. They are stock portraits and are
**not** the people named in the fixtures.

| File | Used for |
|---|---|
| `avatar-saviour.jpg` | The signed-in demo customer |
| `avatar-david-kuunyoo.jpg` | Kojo Mensah, the rider |
| `avatar-fatima-ba-nyagse.jpg` | Ama Boateng, the rider |
| `avatar-solomon-geyidonyah.jpg` | Yaw Osei, the rider |
| `avatar-abu-bakari-sule.jpg`, `avatar-comfort-nangmin.jpg`, `avatar-grace-adengaa.jpg`, `avatar-hawa-musah.jpg`, `avatar-ibrahim-tampuole.jpg`, `avatar-nana-yaa.jpg`, `avatar-listener.jpg` | Spares for future cast members |

---

## 6. Icons

The interface draws its icons from **Lucide** (`lucide-react`, ISC licence),
rendered inline as SVG by `src/components/flash/Icon.tsx` under Flash's own
semantic names. No icon font, no sprite sheet, no network request — the bundle
stays offline-safe for the Capacitor build.

---

## 7. The route map

The map on the Ride and Track screens is **not a photograph and not a real tile
layer**. It is a schematic diagram drawn as vector in
`src/components/track/RouteMap.tsx`: city blocks, roads, the route as a dashed
brand line, the two stops and the rider's position. The neighbourhood labels are
the real Accra places the route crosses.

A real map (Mapbox, Google, OpenStreetMap tiles) needs a tile provider, an API
key and a usage policy; until the backend exists, a fabricated satellite image
would be a lie about where anything is.

---

## Legal note (for a real launch)

- "Flash" and the pulse mark are this project's own identity; they must not
  collide with an existing mark in the same market before launch.
- The photographs carried over from the reference app (`event-sunset-live`,
  `event-afrobeats-zone`, `event-comedy-night`, `event-highlife-night`,
  `event-urban-vibes` and every `avatar-*`) carry **unverified** provenance.
  Treat them as all-rights-reserved by default; do not publish without clearing
  rights.
- The Unsplash photographs (`dish-*`, `restaurant-*`, `ride-*`, and the four new
  `event-*` files) are covered by the Unsplash licence, which permits commercial
  use without attribution — but the same clearance should be confirmed before a
  public launch.
- The people depicted in `avatar-*` are stock portraits, and the people named
  in the fixtures are fictional. Nothing here should be presented as a real
  member of staff, rider or customer.
