/**
 * The incoming Cloudinary transformation, shared by the server action and the
 * one-time migration script. This module holds no secrets and has no runtime
 * dependency, so Node scripts can import the exact same constants the app uses.
 *
 * Cloudinary serializes this as c_limit,w_2400,h_2400,q_auto:good,f_webp.
 * `f_auto` is deliberately absent: it is a delivery-only instruction resolved
 * per request at the CDN, never an upload-time transformation.
 */

export const INCOMING_TRANSFORM = Object.freeze({
  crop: "limit",
  width: 2400,
  height: 2400,
  quality: "auto:good",
  fetch_format: "webp",
} as const);

/** The canonical serialized form, used for assertions and documentation. */
export const INCOMING_TRANSFORM_STRING = "c_limit,w_2400,h_2400,q_auto:good,f_webp";
