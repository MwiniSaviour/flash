# Cloudinary media + Clerk production wiring — design

Date: 2026-11-17
Status: approved for implementation

## Goal

Move Flash's three product-image fields (kitchen cover, dish photo, event poster)
to Cloudinary, keep PostgreSQL as the only data store, and make Clerk the real
session source — without losing the keyless demo that the current UI and
fixtures provide. Every file that reaches storage must be compressed as far as
it can go without a visible drop in quality.

Out of scope: profile avatars (Clerk owns them), payments, driver assignment,
map tiles, and a media management screen.

## Decisions

- **Data:** PostgreSQL through PostgREST (the existing repository seam).
- **Identity:** Clerk. `currentUserId()` stays the single session seam; the
  demo id is used only when Clerk keys are absent.
- **Media:** Cloudinary. No Supabase Storage, no files in `public/` for
  user-supplied images. The existing catalogue photos remain the demo fallback.
- **Dependencies:** `cloudinary` (signed server uploads) and `svix` (verified
  Clerk webhooks). Both are added through npm; no native image library.

## Compression pipeline

Two stages, each with a distinct job:

1. **Incoming transformation on upload** — the stored master is normalized to
   WebP with `c_limit,w_2400,h_2400,q_auto:good`. `q_auto` is Cloudinary's
   perceptual quality algorithm (SSIM-based), and the dimension cap stops a
   phone photo from being stored at full camera resolution. Cloudinary's own
   examples put a 569 KB photograph at ~57 KB with `q_auto:good`. `f_auto` is
   deliberately **not** used here: Cloudinary documents that automatic format
   must be resolved per request at the CDN, never at upload.
2. **Delivery transformation on every URL** — `f_auto,q_auto` plus a width and
   `srcSet`, so an AVIF-capable browser gets AVIF and older browsers get WebP,
   each at the smallest sensible size.

The original is replaced by the compressed master. That is intentional: it is
what makes the storage requirement true.

## Components

### `src/lib/media/` — one boundary for media

- `validate.ts` — shared validation: file size ≤ 8 MB, allowed formats sniffed
  from magic bytes (JPEG, PNG, WebP, AVIF), not from the browser's MIME label.
  Rejects executables, SVG and animation frames.
- `cloudinary.ts` (`server-only`) — signed upload through the Cloudinary SDK:
  folder `flash/{clerkUserId}/{kind}`, `overwrite: false`, `unique_filename`,
  the incoming transformation above, and the Cloudinary `public_id` parsed
  back out of the returned secure URL. Also `destroyImage(publicId)` for
  replacements and compensating deletes.
- `url.ts` — client-safe builders for the delivery URL and `srcSet`. No secrets.
- `assertOwnedUrl(url, userId)` — accepts only Cloudinary URLs inside the
  caller's own folder, so a browser cannot smuggle another tenant's URL into a
  database write.

### Upload action

One `"use server"` action, `uploadImage(formData, kind)`, used by all three
surfaces:

1. `currentUserId()` — signed in, or the demo id when Clerk is absent.
2. Validate the `File` (magic bytes + size).
3. Upload with the incoming transformation.
4. Return `{ url, publicId, bytes }` with a demo note when Cloudinary is not
   configured, so the UI can explain why uploads are unavailable.

Nothing secret reaches the browser; there is no public upload endpoint.

### Callers and the database

- `CoverPicker` gains an "Upload your own photo" control (shown only when
  Cloudinary is configured). The existing 10-photo catalogue stays as the demo
  path. On success it passes the returned URL to `updateCover`.
- `AddDishForm` and `AddEventForm` gain an optional photo/poster upload. Their
  URLs are passed to `publishMenuItem` / `publishEvent`.
- `image_src` remains text — it now holds a Cloudinary secure URL. No new
  assets table: ownership is already enforced by `owner_user_id` on kitchens
  and events, and `assertOwnedUrl` binds an uploaded URL to its uploader.
- Replacing an image destroys the old asset. If a database write fails after a
  successful upload, the new asset is destroyed (compensating delete), so a
  failed operation never leaves an orphan.

### Clerk → PostgreSQL

`src/app/api/webhooks/clerk/route.ts`, verified with `svix`:

- `user.created` / `user.updated` → upsert the `profiles` row (id = Clerk id,
  name, email, avatar, member since, notifications on).
- `user.deleted` → delete the profile; the existing `on delete cascade`
  relationships clean up the rest.
- Signatures are verified with `CLERK_WEBHOOK_SECRET`; unverified requests get
  400 and never touch the database.
- The existing `currentUserId()` seam and conditional `proxy.ts` are unchanged.
  A signed-in user gets a profile row before their first write.

### Configuration

New optional variables in `.env.example` and `getEnv()`:
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` (default `flash`).
`envIssues()` reports half-configured media settings. `next.config.mjs` allows
`res.cloudinary.com` as a remote image host.

Missing keys never break the app: uploads are hidden, the catalogue still works,
the demo customer still works, and the webhook route reports that it is not
configured.

## Error handling

- Invalid files fail before any upload with a plain-language message.
- Cloudinary/network errors are logged server-side; the browser sees a generic
  "upload failed" message, never a key or a signed request.
- A database failure after upload removes the asset.
- Webhook signature failures are rejected before parsing the body.

## Verification

- `npm run check`, `npm run build`, `npm run db:check`.
- Existing Playwright write-flow scripts must still pass in keyless demo mode.
- A Node check script asserts: magic-byte rejection, 8 MB limit, folder-scoped
  URL parsing, and that delivery URLs carry `f_auto,q_auto` and widths.
- Live Cloudinary upload and live Clerk webhook smoke tests require the user's
  keys; they will be reported as unexercised if the keys are not supplied.
