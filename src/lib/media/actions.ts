"use server";

import { currentUserId } from "@/lib/auth/server";
import { hasCloudinaryEnv } from "@/lib/env";
import { uploadImage } from "@/lib/media/cloudinary";
import { validateImageUpload } from "@/lib/media/validate";

import type { UploadedImage } from "./cloudinary";

/**
 * The one upload action.
 *
 * The browser hands over a File, never a credential. The server checks the
 * bytes, signs the upload to Cloudinary and returns the stored public URL.
 * All three photo fields (cover, dish, poster) use this same path.
 */

export type UploadResult =
  | { ok: true; data: UploadedImage }
  | { ok: false; error: string; demo?: boolean };

export async function uploadImageAction(
  formData: FormData,
  kind: "cover" | "dish" | "poster",
): Promise<UploadResult> {
  if (!hasCloudinaryEnv()) {
    return {
      ok: false,
      error: "Cloudinary is not connected. Choose one of the catalogue photos.",
      demo: true,
    };
  }

  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to upload a photo." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a photo first." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const validation = validateImageUpload(bytes, file.type);
  if (!validation.ok) return { ok: false, error: validation.error };

  try {
    const data = await uploadImage(bytes, validation.format, userId, kind);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "The photo could not be uploaded.",
    };
  }
}
