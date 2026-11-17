/**
 * Upload validation.
 *
 * A caller can lie about a file's MIME type, so the bytes are the authority:
 * the format is sniffed from the file signature before anything is stored.
 * Only still-image formats Cloudinary can normalize are accepted. SVG is
 * excluded: it can carry scripts and has no place in a photo field.
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export type Format = { name: string; mime: string };

function ftyp(bytes: Buffer): string {
  if (bytes.length < 12 || bytes.subarray(4, 8).toString("ascii") !== "ftyp") return "";
  return bytes.subarray(8, 12).toString("ascii");
}

/** The format the bytes actually are, or null when we do not accept it. */
export function sniffImageFormat(bytes: Buffer): Format | null {
  const brand = ftyp(bytes);

  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { name: "jpg", mime: "image/jpeg" };
  }

  if (
    bytes.length > 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { name: "png", mime: "image/png" };
  }

  if (
    bytes.length > 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { name: "webp", mime: "image/webp" };
  }

  if (["avif", "avis", "mif1", "msf1"].includes(brand)) {
    return { name: "avif", mime: "image/avif" };
  }

  // iPhones often hand over HEIC. Cloudinary converts it on upload, so the
  // stored master is browser-friendly webp.
  if (["heic", "heix", "hevc", "hevx"].includes(brand)) {
    return { name: "heic", mime: "image/heic" };
  }

  return null;
}

export type ImageValidation =
  | { ok: true; format: Format }
  | { ok: false; error: string };

/** Checks an upload before it leaves the server. */
export function validateImageUpload(
  bytes: Buffer,
  declaredType: string,
): ImageValidation {
  if (bytes.length === 0) return { ok: false, error: "That file is empty." };

  if (bytes.length > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Photos can be at most 8 MB. Try a smaller one." };
  }

  if (!declaredType.startsWith("image/")) {
    return { ok: false, error: "Only image files can be uploaded." };
  }

  const format = sniffImageFormat(bytes);
  if (!format) {
    return {
      ok: false,
      error: "Use a JPEG, PNG, WebP, AVIF or HEIC photograph.",
    };
  }

  return { ok: true, format };
}
