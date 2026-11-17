/**
 * Checks the seed against the migrations.
 *
 * The schema lives in `supabase/migrations` and the seed is generated from the
 * demo fixtures. This script proves the two still agree: every table the seed
 * writes to exists, every column it names exists on that table, and every
 * statement has as many values as it has columns. It catches the drift that
 * would otherwise only show up when the migration runs against a real
 * database.
 *
 *   npm run db:check
 */

import { readFile, readdir } from "node:fs/promises";
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

// Every migration, in order: the schema a database ends up with.
const migrations = [];
for (const file of files) {
  migrations.push({ file, sql: await readFile(path.join(migrationsDir, file), "utf8") });
}

const schema = migrations.map((entry) => entry.sql).join("\n");
const seed = await readFile(path.join(root, "supabase", "seed.sql"), "utf8");

/** The columns of every table the migrations create, plus the ones they add. */
function tablesIn(sql) {
  const tables = new Map();
  const pattern = /create table (?:if not exists )?public\.(\w+)\s*\(([\s\S]*?)\n\);/g;

  for (const match of sql.matchAll(pattern)) {
    const [, name, body] = match;
    const columns = [];

    for (const raw of body.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("--")) continue;

      const column = /^(\w+)\s+(text|integer|bigint|numeric|boolean|date|time|timestamptz|text\[\])/.exec(
        line,
      );
      if (column) columns.push(column[1]);
    }

    tables.set(name, columns);
  }

  // A later migration may add a column to a table an earlier one created.
  const added = /alter table public\.(\w+)\s+add column (\w+)\s+/g;

  for (const match of sql.matchAll(added)) {
    const [, table, column] = match;
    const columns = tables.get(table);
    if (columns && !columns.includes(column)) columns.push(column);
  }

  return tables;
}

const tables = tablesIn(schema);
const problems = [];

for (const [name, columns] of tables) {
  if (columns.length === 0) problems.push(`${name}: no columns found in the migrations`);
}

/** Every insert in the seed, with its column list and its values. */
function insertsIn(sql) {
  const inserts = [];
  const pattern = /insert into public\.(\w+)\s*\(([^)]*)\)\nvalues \(([\s\S]*?)\)\non conflict/g;

  for (const match of sql.matchAll(pattern)) {
    inserts.push({
      table: match[1],
      columns: match[2].split(",").map((column) => column.trim()),
      values: match[3],
    });
  }

  return inserts;
}

const inserts = insertsIn(seed);

if (inserts.length === 0) {
  problems.push("seed: no insert statements found");
}

for (const insert of inserts) {
  const columns = tables.get(insert.table);
  if (!columns) {
    problems.push(`${insert.table}: not created by the migrations`);
    continue;
  }

  for (const column of insert.columns) {
    if (!columns.includes(column)) {
      problems.push(`${insert.table}.${column}: no such column in the migrations`);
    }
  }

  // Count the values, ignoring commas inside quotes and brackets.
  let depth = 0;
  let quoted = false;
  let count = insert.values.trim() ? 1 : 0;

  for (const character of insert.values) {
    if (character === "'") quoted = !quoted;
    if (quoted) continue;
    if (character === "(" || character === "[" || character === "{") depth += 1;
    if (character === ")" || character === "]" || character === "}") depth -= 1;
    if (character === "," && depth === 0) count += 1;
  }

  if (count !== insert.columns.length) {
    problems.push(
      `${insert.table}: ${insert.columns.length} columns but ${count} values (${insert.columns.join(", ")})`,
    );
  }
}

/** Every table the seed touches must be writable by the service role. */
for (const table of new Set(inserts.map((insert) => insert.table))) {
  if (!schema.includes(`grant select, insert, update, delete on table public.${table} to service_role;`)) {
    problems.push(`${table}: no service_role grant in the migrations`);
  }
}

/** Row Level Security has to be on for every table the seed writes to. */
for (const table of new Set(inserts.map((insert) => insert.table))) {
  if (!schema.includes(`alter table public.${table} enable row level security;`)) {
    problems.push(`${table}: row level security is not enabled`);
  }
}

if (problems.length > 0) {
  console.error("the seed does not match the migrations:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `seed matches ${files.length} migration${files.length === 1 ? "" : "s"}: ${inserts.length} statements across ${tables.size} tables.`,
);
