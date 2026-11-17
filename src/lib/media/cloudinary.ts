import "server-only";

import { v2 as cloudinary } from "cloudinary";

import { getEnv, hasCloudinaryEnv } from "@/lib/env";

import type { Format } from "./validate";

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

const INCOMING = {
  width: 2400,
  height: 2400,
  crop: "limit",
  quality: "auto:good",
  fetch_format: "webp",
} as const;

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

  try {
    const result = await client.uploader.upload(
      `data:${format.mime};base64,${bytes.toString("base64")}`,
      {
        folder: `${cloudinaryFolder}/${userId}/${kind}`,
        resource_type: "image",
        overwrite: false,
        unique_filename: true,
        transformation: INCOMING,
      },
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes ?? bytes.length,
      width: result.width ?? 0,
      height: result.height ?? 0,
    };
  } catch (error) {
    // The browser never sees a credential, a signed request or a provider
    // message — only the fact that the upload did not work.
    console.error("[media] upload failed", error);
    throw new Error("The photo could not be uploaded. Try again.");
  }
}

/** Removes an asset after a replacement or a failed database write. */
export async function destroyImage(publicId: string): Promise<void> {
  const client = configuredCloudinary();
  if (!client) return;

  try {
    await client.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    // A leftover asset is recoverable; losing the user's write is not.
    console.error("[media] cleanup failed", publicId, error);
  }
}
