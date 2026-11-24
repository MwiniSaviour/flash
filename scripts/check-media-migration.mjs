/**
 * Prove the product catalogue no longer points at local image files.
 *
 *   npm run media:check-migration            # offline fixture report, exit 0
 *   npm run media:check-migration -- --strict # same checks, exit 1 on findings
 *   npm run media:check-migration            # with DB credentials: strict gate
 *
 * With database credentials the gate is strict: any row still pointing at
 * /assets/images/, missing a Cloudinary URL or missing its public id exits 1.
 * With no database configured the script still runs, reading supabase/seed.sql
 * (generated from the fixtures), and reports the same findings without
 * treating the absent credentials as an error. This is a report, not a failed
 * gate: the demo catalogue is expected to reference the local files until
 * media:migrate has been run with real credentials.
 *
 * No credentials, tokens or secret values are ever printed.
 */

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localPrefix = "/assets/images/";
const tables = ["events", "restaurants", "menu_items"];
const strict = process.argv.includes("--strict");

function cloudinaryUrl(src) {
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      /^\/[^/]+\/image\/upload\//.test(url.pathname)
    );
  } catch {
    return false;
  }
}

/** Split a SQL `values (...)` tuple, respecting quotes and array literals. */
function splitValues(text) {
  const values = [];
  let current = "";
  let quoted = false;
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === "'" && text[index + 1] === "'") {
        current += "''";
        index += 1;
      } else if (character === "'") {
        quoted = false;
        current += character;
      } else {
        current += character;
      }
      continue;
    }
    if (character === "'") {
      quoted = true;
      current += character;
      continue;
    }
    if (character === "{" || character === "[") depth += 1;
    if (character === "}" || character === "]") depth -= 1;
    if (character === "," && depth === 0) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  if (current.trim()) values.push(current.trim());
  return values;
}

function unquote(value) {
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  return value;
}

/** Offline rows from the generated seed — the same rows a fresh DB would get. */
async function seedRows() {
  const seed = await readFile(path.join(root, "supabase", "seed.sql"), "utf8");
  const pattern = /insert into public\.(\w+)\s*\(([^)]*)\)\nvalues \(([\s\S]*?)\)\non conflict/g;
  const rows = [];
  for (const match of seed.matchAll(pattern)) {
    const [, table, columns, rawValues] = match;
    if (!tables.includes(table)) continue;
    const names = columns.split(",").map((column) => column.trim());
    const values = splitValues(rawValues);
    const idIndex = names.indexOf("id");
    const srcIndex = names.indexOf("image_src");
    if (idIndex < 0 || srcIndex < 0 || values.length !== names.length) continue;
    rows.push({ table, id: unquote(values[idIndex]), image_src: unquote(values[srcIndex]) });
  }
  if (rows.length === 0) throw new Error("No product image rows found in supabase/seed.sql");
  return rows;
}

/** Live rows from PostgREST when the database is configured. */
async function databaseRows() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rows = [];

  for (const table of tables) {
    let offset = 0;
    const pageSize = 500;
    for (;;) {
      const response = await fetch(
        `${base}/rest/v1/${table}?select=id,image_src,image_url,image_public_id&limit=${pageSize}&offset=${offset}`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Range: `${offset}-${offset + pageSize - 1}`,
          },
          cache: "no-store",
        },
      );
      if (!response.ok) throw new Error(`Database request failed (${response.status}) for ${table}`);
      const batch = await response.json();
      if (!Array.isArray(batch)) throw new Error(`Unexpected row shape from ${table}`);
      rows.push(...batch.map((row) => ({ ...row, table })));
      if (batch.length < pageSize) break;
      offset += pageSize;
    }
  }
  if (rows.length === 0) throw new Error("No product image rows found in the database");
  return rows;
}

async function main() {
  const databaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
  const mode = databaseConfigured ? "database" : "offline fixtures (no database configured)";
  const rows = databaseConfigured ? await databaseRows() : await seedRows();

  const problems = [];
  for (const row of rows) {
    const id = `${row.table}/${row.id}`;
    const src = row.image_src || row.image_url;

    if (!src) {
      problems.push(`${id}: missing Cloudinary URL`);
      continue;
    }
    if (src.startsWith(localPrefix)) {
      problems.push(`${id}: still points at ${localPrefix}`);
      if (!databaseConfigured) {
        const file = path.join(root, "public", src);
        try {
          await access(file);
        } catch {
          problems.push(`${id}: referenced local file is missing (${src})`);
        }
      }
      continue;
    }
    if (!cloudinaryUrl(src)) problems.push(`${id}: image URL is not a Cloudinary URL`);

    if (databaseConfigured && !row.image_public_id) {
      problems.push(`${id}: missing Cloudinary public id`);
    }
  }

  console.log(`mode: ${mode}`);
  console.log(`rows checked: ${rows.length}`);
  if (problems.length === 0) {
    console.log("all product image rows point at Cloudinary");
  } else {
    console.log(`rows pending migration: ${problems.length}`);
    for (const problem of problems) console.log(`  ${problem}`);
  }

  if (!databaseConfigured && !strict) {
    console.log(
      "report only: absent credentials are not a failure; run media:migrate with credentials, then re-check with --strict.",
    );
    return;
  }

  if (problems.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Media migration check failed.");
  process.exitCode = 1;
});
