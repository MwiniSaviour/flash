/**
 * One-time backfill of the demo product catalogue into Cloudinary.
 *
 *   npm run media:migrate
 *
 * This is the only place that reads local image bytes outside the browser. It
 * is deliberately conservative:
 *
 *   - it refuses to start unless Cloudinary AND database credentials exist;
 *   - it uses the exact validation and incoming transformation constants the
 *     server action uses (the "use server" action itself cannot be imported
 *     into Node), so the stored master is compressed webp with no f_auto;
 *   - it only rewrites rows whose owning seller is known, and binds the upload
 *     to that seller's folder before any database write;
 *   - it never prints a credential, and NEVER deletes a local file. Deletion
 *     is a separate, later step after check-media-migration has passed.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { v2 as cloudinary } from "cloudinary";

import { INCOMING_TRANSFORM, INCOMING_TRANSFORM_STRING } from "../src/lib/media/transform.ts";
import { validateImageUpload } from "../src/lib/media/validate.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imageRoot = path.join(root, "public", "assets", "images");
const localPrefix = "/assets/images/";
const tables = [
  { table: "events", kind: "poster" },
  { table: "restaurants", kind: "cover" },
  { table: "menu_items", kind: "dish" },
];
const mimeByExtension = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".heic": "image/heic",
};

function required(name) {
  const value = process.env[name]?.trim().replace(/^["']|["']$/g, "");
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optional(name, fallback = "") {
  return process.env[name]?.trim().replace(/^["']|["']$/g, "") || fallback;
}

/** Resolve a fixture path to a file under public/assets/images, or fail. */
function localFileFor(src) {
  if (!src.startsWith(localPrefix)) return null;
  const relative = src.slice(localPrefix.length);
  if (!relative || relative.includes("..")) {
    throw new Error(`Unsafe image path in a product row: ${src}`);
  }
  const absolute = path.resolve(imageRoot, relative);
  if (absolute !== imageRoot && !absolute.startsWith(imageRoot + path.sep)) {
    throw new Error(`Image path escapes the catalogue: ${src}`);
  }
  return absolute;
}

function isCloudinaryUrl(src, cloudName) {
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith(`/${cloudName}/image/upload/`)
    );
  } catch {
    return false;
  }
}

async function main() {
  // Names only: values are never logged.
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const cloudName =
    optional("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME") || required("CLOUDINARY_CLOUD_NAME");
  const apiKey = required("CLOUDINARY_API_KEY");
  const apiSecret = required("CLOUDINARY_API_SECRET");
  const cloudinaryFolder = optional("CLOUDINARY_FOLDER", "flash");

  const base = supabaseUrl.replace(/\/+$/, "");
  async function rest(pathname, init = {}) {
    const response = await fetch(`${base}/rest/v1/${pathname}`, {
      ...init,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Database request failed (${response.status}) for ${pathname.split("?")[0]}`);
    }
    return response;
  }

  async function rowsFor(table) {
    const rows = [];
    const pageSize = 500;
    for (let start = 0; ; start += pageSize) {
      const response = await rest(
        `${table}?select=id,image_src,image_url,image_public_id,seller_user_id&limit=${pageSize}&offset=${start}`,
        { headers: { Range: `${start}-${start + pageSize - 1}` } },
      );
      const batch = await response.json();
      if (!Array.isArray(batch)) throw new Error(`Unexpected row shape from ${table}`);
      rows.push(...batch);
      if (batch.length < pageSize) break;
    }
    return rows;
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

  const migrated = [];
  const failures = [];

  for (const { table, kind } of tables) {
    const rows = await rowsFor(table);
    for (const row of rows) {
      const src = row.image_src;
      if (!src || !src.startsWith(localPrefix)) continue;

      const id = String(row.id);
      const owner = row.seller_user_id;
      if (!owner) {
        failures.push({ id, reason: "no owning seller; refusing to create an unowned asset" });
        continue;
      }

      let uploadedId = null;
      try {
        const local = localFileFor(src);
        if (!local) throw new Error(`Unresolved local path: ${src}`);
        const bytes = await readFile(local);
        const declaredType = mimeByExtension[path.extname(local).toLowerCase()] ?? "image/jpeg";
        const validation = validateImageUpload(bytes, declaredType);
        if (!validation.ok) throw new Error(validation.error);

        const folder = `${cloudinaryFolder}/${owner}/${kind}`;
        const uploaded = await cloudinary.uploader.upload(
          `data:${validation.format.mime};base64,${bytes.toString("base64")}`,
          {
            folder,
            resource_type: "image",
            overwrite: false,
            unique_filename: true,
            transformation: INCOMING_TRANSFORM,
          },
        );

        // The same ownership binding the server action enforces: never store a
        // URL the owning seller could not later manage.
        if (
          !uploaded.public_id?.startsWith(`${folder}/`) ||
          !isCloudinaryUrl(uploaded.secure_url, cloudName)
        ) {
          if (uploaded.public_id) await cloudinary.uploader.destroy(uploaded.public_id);
          throw new Error("upload escaped the owning seller's folder");
        }
        uploadedId = uploaded.public_id;

        await rest(`${table}?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            image_src: uploaded.secure_url,
            image_url: uploaded.secure_url,
            image_public_id: uploaded.public_id,
          }),
        });

        uploadedId = null;
        migrated.push({ id, url: uploaded.secure_url });
      } catch (error) {
        // A row that was not written must not leave its uploaded asset behind.
        if (uploadedId) {
          try {
            await cloudinary.uploader.destroy(uploadedId);
          } catch {
            console.error(`[media] cleanup failed for ${id}`);
          }
        }
        failures.push({ id, reason: error instanceof Error ? error.message : "upload failed" });
      }
    }
  }

  console.log("id\turl");
  for (const row of migrated) console.log(`${row.id}\t${row.url}`);
  console.log(`\nmigrated ${migrated.length} row(s); failed ${failures.length}`);
  console.log(`incoming transform: ${INCOMING_TRANSFORM_STRING} (no f_auto)`);
  console.log("local files were not modified or deleted; run check-media-migration before removing them.");

  for (const failure of failures) console.error(`failed ${failure.id}: ${failure.reason}`);
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Image migration failed.");
  process.exitCode = 1;
});
