/**
 * Cloudinary URLs.
 *
 * This module is safe on both sides of the wire: it only builds strings and
 * never holds a secret. The stored URL is the public Cloudinary URL; delivery
 * adds `f_auto,q_auto` and a width so each browser gets the smallest format it
 * can display.
 */

import { getEnv } from "../env.ts";

const UPLOAD_PATH = "/image/upload/";

function isCloudinaryUrl(src: string): boolean {
  const env = getEnv();

  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      Boolean(env.cloudinaryCloudName) &&
      url.pathname.startsWith(`/${env.cloudinaryCloudName}${UPLOAD_PATH}`)
    );
  } catch {
    return false;
  }
}

/** The public id a Cloudinary URL points at, without version or extension. */
export function publicIdFromUrl(src: string): string | null {
  if (!isCloudinaryUrl(src)) return null;

  const path = new URL(src).pathname.split(UPLOAD_PATH)[1] ?? "";
  const withoutVersion = path.replace(/^v\d+\//, "");
  return withoutVersion.replace(/\.[a-z0-9]+$/i, "") || null;
}

/**
 * A catalogue photograph or a Cloudinary asset the caller uploaded.
 *
 * Product forms always send a photograph, even when the owner picks one from
 * the fixed catalogue. Only Cloudinary assets need an ownership check; a local
 * catalogue path is public by design and cannot point at another account.
 */
export function isAllowedImageUrl(src: string | undefined, userId: string): boolean {
  if (!src) return true;
  if (src.startsWith("/assets/images/")) return true;
  return isOwnedCloudinaryUrl(src, userId);
}

/**
 * Accepts only a Cloudinary URL inside the caller's own folder.
 *
 * A browser sends this value back with a database write; without this check a
 * caller could point a kitchen at somebody else's asset.
 */
export function isOwnedCloudinaryUrl(src: string, userId: string): boolean {
  const publicId = publicIdFromUrl(src);
  if (!publicId) return false;

  const { cloudinaryFolder } = getEnv();
  return publicId.startsWith(`${cloudinaryFolder}/${userId}/`);
}

/** Adds the delivery optimizations to a stored URL. Local photos pass through. */
export function deliveryUrl(src: string, width?: number): string {
  if (!isCloudinaryUrl(src)) return src;

  const parts = ["f_auto", "q_auto"];
  if (width && Number.isFinite(width) && width > 0) parts.push(`w_${Math.round(width)}`);

  return src.replace(UPLOAD_PATH, `${UPLOAD_PATH}${parts.join(",")}/`);
}

/** Responsive candidates for a stored URL. */
export function deliverySrcSet(src: string, widths: number[] = [480, 800, 1200]): string {
  if (!isCloudinaryUrl(src)) return "";
  return widths.map((width) => `${deliveryUrl(src, width)} ${width}w`).join(", ");
}
