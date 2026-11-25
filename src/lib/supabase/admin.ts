import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getEnv } from "@/lib/env";

/**
 * The service-role client.
 *
 * This is the only module in the app that holds the service role key, and the
 * `server-only` guard makes sure it can never be bundled into the browser.
 * The key bypasses Row Level Security, which is exactly why every query in the
 * repository has to scope itself to the signed-in customer: the database trusts
 * the server, not the request.
 */
export function createAdminClient() {
  const env = getEnv();
  if (!env.databaseApiUrl || !env.databaseServiceRoleKey) {
    console.error("[admin] database admin client unavailable", {
      hasUrl: Boolean(env.databaseApiUrl),
      hasServiceRoleKey: Boolean(env.databaseServiceRoleKey),
    });
    return null;
  }

  return createClient(env.databaseApiUrl, env.databaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
