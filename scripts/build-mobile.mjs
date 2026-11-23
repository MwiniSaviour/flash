import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Build the Capacitor web bundle.
 *
 * The web app is a server-rendered Next.js app; the phone gets a static export
 * of its demo mode. To get there this script copies the sources into a scratch
 * directory and strips the pieces a static export cannot run: route handlers,
 * middleware, the force-dynamic flags and the auth-gated admin shell. Dynamic
 * segments get their params from the seeded fixtures. Nothing in the real
 * source tree is changed.
 *
 * This follows the ScalMart (./project/ecommerce) reference, where Capacitor
 * consumes `out/` from `output: "export"`.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scratch = path.join(root, ".mobile-build");

function rm(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copyFile(relative) {
  const from = path.join(root, relative);
  if (!fs.existsSync(from)) return;
  const to = path.join(scratch, relative);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function matches(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

function fixtureIds(files, prefix) {
  const ids = new Set();
  for (const file of files) {
    const full = path.join(root, "src/lib/flash/data", file);
    if (!fs.existsSync(full)) continue;
    const source = fs.readFileSync(full, "utf8");
    for (const id of matches(source, /\bid:\s*"([^"]+)"/g)) {
      if (id.startsWith(prefix)) ids.add(id);
    }
  }
  return [...ids];
}

function slugList(file) {
  const source = fs.readFileSync(path.join(root, "src/lib/flash/data", file), "utf8");
  return [...new Set(matches(source, /\bslug:\s*"([^"]+)"/g))];
}

function dishParams() {
  const source = fs.readFileSync(path.join(root, "src/lib/flash/data/food.ts"), "utf8");
  const params = [];
  let slug = null;
  for (const line of source.split("\n")) {
    const slugMatch = line.match(/\bslug:\s*"([^"]+)"/);
    if (slugMatch) slug = slugMatch[1];
    const itemMatch = line.match(/\bid:\s*"(mi-[^"]+)"/);
    if (slug && itemMatch) params.push({ slug, itemId: itemMatch[1] });
  }
  return params;
}

function appendParams(relative, value) {
  const target = path.join(scratch, relative);
  if (!fs.existsSync(target)) return;
  const source = fs.readFileSync(target, "utf8");
  fs.writeFileSync(
    target,
    `${source}\n\nexport function generateStaticParams() {\n  return ${JSON.stringify(value, null, 2)};\n}\n`,
  );
}

function walk(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full));
    else if (entry.name === "page.tsx" || entry.name === "layout.tsx") found.push(full);
  }
  return found;
}

function allFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...allFiles(full));
    else found.push(full);
  }
  return found;
}

function crossProduct(params, values) {
  return params.reduce(
    (rows, name) => rows.flatMap((row) => values[name].map((v) => ({ ...row, [name]: v }))),
    [{}],
  );
}

function stubActions(target) {
  if (!fs.existsSync(target)) return;
  const source = fs.readFileSync(target, "utf8");
  if (!source.includes('"use server"')) return;
  const types = [...source.matchAll(/export type (\w+)/g)].map(
    (match) => `export type ${match[1]} = any;`,
  );
  const names = [...source.matchAll(/export async function (\w+)\(/g)].map((match) => match[1]);
  const stubs = names.map(
    (name) =>
      `export async function ${name}(...args: unknown[]): Promise<any> {\n  void args;\n  throw new Error("Server actions are unavailable in the static mobile build");\n}`,
  );
  fs.writeFileSync(target, `${[...types, ...stubs].join("\n\n")}\n`);
}

function stubClerk() {
  const stubs = path.join(scratch, "stubs");
  fs.mkdirSync(stubs, { recursive: true });
  fs.writeFileSync(
    path.join(stubs, "clerk.tsx"),
    `"use client";
import type { ReactNode } from "react";
export function ClerkProvider({ children }: any) { return <>{children as ReactNode}</>; }
export function useUser(): any { return { user: null, isLoaded: true }; }
export function SignOutButton({ children }: any) { return <>{children as ReactNode}</>; }
export function UserButton(_props: any): any { return null; }
export function HandleSSOCallback(_props: any): any { return null; }
export function useClerk(): any { return { signOut: async () => {}, openUserProfile: async () => {} }; }
export function useSignIn(): any { return { isLoaded: true, signIn: null }; }
export function useSignUp(): any { return { isLoaded: true, signUp: null }; }
`,
  );
  fs.writeFileSync(
    path.join(stubs, "clerk-server.ts"),
    `export async function auth(): Promise<{ userId: string | null; sessionClaims: { publicMetadata?: { role?: string } } | null }> { return { userId: null, sessionClaims: null }; }
export async function currentUser(): Promise<any> { return null; }
export function clerkMiddleware(): any { return () => ({ next: () => ({}) }); }
`,
  );

  const config = path.join(scratch, "tsconfig.json");
  const tsconfig = JSON.parse(fs.readFileSync(config, "utf8"));
  tsconfig.compilerOptions.paths = {
    "@clerk/nextjs": ["./stubs/clerk.tsx"],
    "@clerk/nextjs/server": ["./stubs/clerk-server.ts"],
    ...tsconfig.compilerOptions.paths,
  };
  fs.writeFileSync(config, JSON.stringify(tsconfig, null, 2));
}

function patchSearchParams(relative) {
  const target = path.join(scratch, relative);
  if (!fs.existsSync(target)) return;
  const source = fs.readFileSync(target, "utf8");
  const patched = source
    .replace(/^\s*searchParams: Promise<.*>;\s*$/gm, "  __flashQuery?: any;\n")
    .replace(/^\s*searchParams,\s*$/gm, "  __flashQuery = {} as any,\n")
    .replace(/\bsearchParams\b/g, "__flashQuery")
    .replace(/\bawait\s+__flashQuery\b/g, "__flashQuery");
  fs.writeFileSync(target, patched);
}

function patchDynamic(relative) {
  const target = path.join(scratch, relative);
  if (!fs.existsSync(target)) return;
  const source = fs.readFileSync(target, "utf8");
  fs.writeFileSync(
    target,
    source.replace(/export const dynamic\s*=\s*"force-dynamic";\s*/g, ""),
  );
}

function prepare() {
  fs.mkdirSync(scratch, { recursive: true });
  for (const entry of ["src", "public", "out"]) rm(path.join(scratch, entry));
  for (const link of ["node_modules"]) rm(path.join(scratch, link));
  for (const file of ["server-reference-manifest.json", "server-reference-manifest.js"]) {
    rm(path.join(scratch, ".next/server", file));
  }

  for (const file of [
    "package.json",
    "next.config.mjs",
    "tsconfig.json",
    "postcss.config.mjs",
    "eslint.config.mjs",
    "next-env.d.ts",
  ]) {
    copyFile(file);
  }
  fs.cpSync(path.join(root, "src"), path.join(scratch, "src"), { recursive: true });
  if (fs.existsSync(path.join(root, "public"))) {
    fs.cpSync(path.join(root, "public"), path.join(scratch, "public"), { recursive: true });
  }
  fs.symlinkSync(path.join(root, "node_modules"), path.join(scratch, "node_modules"), "dir");

  rm(path.join(scratch, "src/app/api"));
  rm(path.join(scratch, "src/app/robots.ts"));
  rm(path.join(scratch, "src/app/sitemap.ts"));
  rm(path.join(scratch, "src/proxy.ts"));

  for (const file of allFiles(path.join(scratch, "src/lib"))) {
    if (file.endsWith(".ts")) stubActions(file);
  }
  stubClerk();

  // Static export cannot render force-dynamic routes. Patch every page and
  // layout, not just the three known ones, so a new live-only screen cannot
  // break the mobile build again.
  for (const file of allFiles(path.join(scratch, "src/app"))) {
    if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
    patchDynamic(path.relative(scratch, file));
  }

  for (const file of [
    "src/app/(app)/events/[slug]/checkout/page.tsx",
    "src/app/(app)/search/page.tsx",
    "src/app/admin/page.tsx",
    "src/app/sign-in/page.tsx",
    "src/app/sign-up/page.tsx",
  ]) {
    patchSearchParams(file);
  }

  const values = {
    slug: [...new Set([...slugList("events.ts"), ...slugList("food.ts")])],
    itemId: [...new Set(dishParams().map(({ itemId }) => itemId))],
    id: [
      ...fixtureIds(["account.ts", "tracking.ts"], "ord-"),
      ...fixtureIds(["tracking.ts"], "par-"),
      ...fixtureIds(["tracking.ts"], "ride-"),
      ...fixtureIds(["account.ts", "business.ts"], "tkt-"),
    ],
    businessId: fixtureIds(["business.ts"], "biz-"),
  };

  const appDir = path.join(scratch, "src/app");
  for (const file of walk(appDir)) {
    const relative = path.relative(scratch, file);
    const params = [...relative.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]);
    if (!params.length) continue;
    const value = params.includes("itemId")
      ? dishParams()
      : crossProduct(params, values);
    appendParams(relative, value);
  }
}

function build() {
  const env = {
    ...process.env,
    FLASH_STATIC_EXPORT: "1",
    NEXT_IMAGE_OPTIMIZATION: "off",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  const next = path.join(root, "node_modules/next/dist/bin/next");
  const result = spawnSync(process.execPath, [next, "build", "--webpack"], {
    cwd: scratch,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function collect() {
  const exported = path.join(scratch, "out");
  if (!fs.existsSync(exported)) {
    throw new Error("Static export did not produce an out/ directory");
  }
  rm(path.join(root, "out"));
  fs.cpSync(exported, path.join(root, "out"), { recursive: true });
  console.log(`Mobile web bundle written to ${path.join(root, "out")}`);
}

prepare();
build();
collect();
