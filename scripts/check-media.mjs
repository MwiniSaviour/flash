/**
 * Checks the media rules without contacting Cloudinary.
 *
 *   npm run media:check
 *
 * The upload boundary is the risky part: wrong bytes, oversized files or an
 * asset from somebody else's folder must never reach storage or a database
 * write. This script proves those rules and the delivery URLs.
 */

import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "flash-test";
process.env.CLOUDINARY_FOLDER = "flash";

const { sniffImageFormat, validateImageUpload } = await import(
  "../src/lib/media/validate.ts"
);
const { deliverySrcSet, deliveryUrl, isOwnedCloudinaryUrl, publicIdFromUrl } =
  await import("../src/lib/media/url.ts");

// A local catalogue photo is left alone.
assert.equal(deliveryUrl("/assets/images/dish-fried-rice.jpg"), "/assets/images/dish-fried-rice.jpg");

// Magic bytes, not the declared MIME type, decide what a file is.
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
assert.equal(sniffImageFormat(jpeg)?.name, "jpg");
assert.equal(sniffImageFormat(Buffer.from("<svg onload=alert(1)>")), null);
assert.equal(validateImageUpload(jpeg, "image/jpeg").ok, true);
assert.equal(validateImageUpload(jpeg, "application/x-php").ok, false);
assert.equal(validateImageUpload(Buffer.alloc(8 * 1024 * 1024 + 1), "image/jpeg").ok, false);
assert.equal(validateImageUpload(Buffer.alloc(0), "image/jpeg").ok, false);

// An uploaded asset: delivery adds f_auto/q_auto and responsive widths.
const stored = "https://res.cloudinary.com/flash-test/image/upload/v123/flash/user_1/cover/abc.webp";
assert.equal(publicIdFromUrl(stored), "flash/user_1/cover/abc");
assert.equal(
  deliveryUrl(stored, 800),
  "https://res.cloudinary.com/flash-test/image/upload/f_auto,q_auto,w_800/v123/flash/user_1/cover/abc.webp",
);
assert.match(deliverySrcSet(stored), /480w.*800w.*1200w/);
assert.equal(isOwnedCloudinaryUrl(stored, "user_1"), true);
assert.equal(isOwnedCloudinaryUrl(stored, "user_2"), false);
assert.equal(isOwnedCloudinaryUrl("https://elsewhere.test/x.png", "user_1"), false);

console.log("media checks: 13 passed");
