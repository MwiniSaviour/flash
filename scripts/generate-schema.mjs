/**
 * Mirrors the Supabase migrations into `src/lib/supabase/schema.sql`.
 *
 * The migrations under `supabase/migrations/` are the source of truth — they
 * are what a real database runs. `schema.sql` is the same DDL kept where the
 * project docs point at it, so nobody reads a stale copy of the schema.
 *
 * Every migration is applied, in order: the mirror is the schema a database
 * ends up with, not just the last file.
 *
 *   npm run db:schema
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "supabase", "migrations");

const files = (await readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error("no migrations found in supabase/migrations");
  process.exit(1);
}

const parts = [];

for (const file of files) {
  const body = await readFile(path.join(migrationsDir, file), "utf8");
  parts.push(`-- supabase/migrations/${file}\n${body.trim()}\n`);
}

const header = `-- Flash schema.
--
-- GENERATED FILE — do not edit.
-- Source: supabase/migrations (${files.length} migration${files.length === 1 ? "" : "s"})
-- Refresh: npm run db:schema
--
`;

const target = path.join(root, "src", "lib", "supabase", "schema.sql");
await writeFile(target, header + parts.join("\n"), "utf8");

console.log(`wrote ${target} from ${files.length} migrations`);
