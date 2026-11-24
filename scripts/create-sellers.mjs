/**
 * Provision the five real Clerk seller accounts and their seller rows.
 *
 * Credentials are never committed: the operator supplies a local JSON file
 * through FLASH_SELLERS_FILE with exactly five entries:
 *
 *   [{ "email": "...", "displayName": "...", "password": "..." }, ...]
 *
 * Only Clerk user ids are printed. Emails, passwords and tokens are never
 * logged, and the script refuses to run without every credential.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

const CLERK_API = "https://api.clerk.com/v1";

function env(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function clerkRequest(pathname, secret, init = {}) {
  const response = await fetch(`${CLERK_API}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Clerk API returned ${response.status} for ${pathname}`);
  }

  return response.json();
}

async function findClerkUser(email, secret) {
  let offset = 0;
  const limit = 100;

  while (offset < 1000) {
    const users = await clerkRequest(
      `/users?limit=${limit}&offset=${offset}`,
      secret,
    );
    if (!Array.isArray(users)) throw new Error("Clerk users response is unexpected.");

    const match = users.find((user) =>
      user.email_addresses?.some(
        (entry) => entry.email_address?.toLowerCase() === email.toLowerCase(),
      ),
    );
    if (match) return match;
    if (users.length < limit) return null;
    offset += limit;
  }

  throw new Error("Clerk user list is too large to search safely.");
}

async function ensureClerkUser(seller, secret) {
  const existing = await findClerkUser(seller.email, secret);
  if (existing) return existing.id;

  const body = {
    email_address: [seller.email],
    first_name: seller.displayName.split(" ")[0] ?? "",
    last_name: seller.displayName.split(" ").slice(1).join(" ") || "Seller",
    public_metadata: { role: "seller" },
    ...(seller.password ? { password: seller.password } : {}),
  };

  const created = await clerkRequest("/users", secret, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return created.id;
}

async function upsertSellerRow(clerkUserId, seller, supabaseUrl, serviceRoleKey) {
  const endpoint = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/sellers`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      clerk_user_id: clerkUserId,
      display_name: seller.displayName,
      email: seller.email,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Seller row write returned ${response.status}`);
  }
}

async function main() {
  const clerkSecret = env("CLERK_SECRET_KEY");
  const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const file = path.resolve(env("FLASH_SELLERS_FILE"));

  const parsed = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(parsed) || parsed.length !== 5) {
    throw new Error("FLASH_SELLERS_FILE must contain exactly five seller entries.");
  }

  for (const seller of parsed) {
    if (!seller.email || !seller.displayName) {
      throw new Error("A seller entry is missing email or displayName.");
    }
  }

  const ids = [];
  for (const seller of parsed) {
    const clerkUserId = await ensureClerkUser(seller, clerkSecret);
    await upsertSellerRow(clerkUserId, seller, supabaseUrl, serviceRoleKey);
    ids.push(clerkUserId);
  }

  for (const id of ids) console.log(id);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seller provisioning failed.");
  process.exitCode = 1;
});
