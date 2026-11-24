import "server-only";

import { v2 as cloudinary } from "cloudinary";

import { getEnv, hasCloudinaryEnv } from "@/lib/env";

import { INCOMING_TRANSFORM } from "./transform";
import { isOwnedCloudinaryUrl } from "./url";
import type { Format } from "./validate";

export { INCOMING_TRANSFORM, INCOMING_TRANSFORM_STRING } from "./transform";

/**
 * Signed uploads to Cloudinary.
 *
 * The only place in the app with the Cloudinary credentials. Every upload is
 * compressed *before it is stored*: the incoming transformation caps the
 * dimensions at 2400px, normalizes to webp and applies q_auto:good, Cloudinary's
 * perceptual quality setting. Delivery then adds f_auto so the browser gets
 * the smallest format it can display.
 *
 * f_auto is deliberately absent here: Cloudinary resolves it per request at
 * the CDN, which cannot happen at upload time.
 */

export type UploadedImage = {
  /** The public URL stored in image_src. */
  url: string;
  /** The Cloudinary id, used to remove the asset on replace or failure. */
  publicId: string;
  /** Bytes held in storage after compression. */
  bytes: number;
  width: number;
  height: number;
};

function configuredCloudinary() {
  if (!hasCloudinaryEnv()) return null;

  const env = getEnv();
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName ?? "",
    api_key: env.cloudinaryApiKey ?? "",
    api_secret: env.cloudinaryApiSecret ?? "",
    secure: true,
  });

  return cloudinary;
}

/** Uploads one image and returns its stored, compressed public URL. */
export async function uploadImage(
  bytes: Buffer,
  format: Format,
  userId: string,
  kind: "cover" | "dish" | "poster",
): Promise<UploadedImage> {
  const client = configuredCloudinary();
  if (!client) throw new Error("Cloudinary is not configured.");

  const { cloudinaryFolder } = getEnv();
  const expectedFolder = `${cloudinaryFolder}/${userId}/${kind}`;

  try {
    const result = await client.uploader.upload(
      `data:${format.mime};base64,${bytes.toString("base64")}`,
      {
        folder: expectedFolder,
        resource_type: "image",
        overwrite: false,
        unique_filename: true,
        transformation: INCOMING_TRANSFORM,
      },
    );

    // Fail closed: a URL outside the uploader's own folder would be rejected by
    // every later write anyway, and leaving the asset behind wastes storage.
    if (
      !result.public_id?.startsWith(`${expectedFolder}/`) ||
      !isOwnedCloudinaryUrl(result.secure_url, userId)
    ) {
      if (result.public_id) await destroyImage(result.public_id);
      throw new Error("Uploaded outside the signed-in seller's folder.");
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes ?? bytes.length,
      width: result.width ?? 0,
      height: result.height ?? 0,
    };
  } catch {
    // The browser never sees a credential, a signed request or a provider
    // message — only the fact that the upload did not work. Provider errors are
    // not logged verbatim: they can carry signed request details.
    console.error("[media] upload failed");
    throw new Error("The photo could not be uploaded. Try again.");
  }
}

/** Removes an asset after a replacement or a failed database write. */
export async function destroyImage(publicId: string): Promise<void> {
  const client = configuredCloudinary();
  // Safe no-op: uploadImage() refuses to run without credentials, so in this
  // state there is no asset in our account to remove. Cleanup is best-effort
  // by design — aborting a user's write over an impossible delete would be worse.
  if (!client) return;

  try {
    await client.uploader.destroy(publicId, { invalidate: true });
  } catch {
    // A leftover asset is recoverable; losing the user's write is not.
    console.error("[media] cleanup failed", publicId);
  }
}

/**
 * The write side of the upload boundary.
 *
 * Every image write goes through here so the asset lifecycle cannot drift:
 * a replacement removes the previous asset only after the write succeeds, and
 * a failed write removes the freshly uploaded asset instead of orphaning it.
 * Cleanup is best-effort by design — losing a user's write is worse than a
 * leftover asset — but it is always attempted.
 */
export async function commitImageWrite<T>({
  newPublicId,
  uploadedPublicId = newPublicId,
  previousPublicId,
  write,
}: {
  /** The effective public id after the write; null for a local catalogue photo. */
  newPublicId: string | null;
  /** The freshly uploaded asset, destroyed only if the write fails. */
  uploadedPublicId?: string | null;
  previousPublicId?: string | null;
  write: () => Promise<T>;
}): Promise<T> {
  try {
    const result = await write();
    if (previousPublicId && previousPublicId !== newPublicId) {
      await destroyImage(previousPublicId);
    }
    return result;
  } catch (error) {
    if (uploadedPublicId) await destroyImage(uploadedPublicId);
    throw error;
  }
}
