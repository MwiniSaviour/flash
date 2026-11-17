import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getEnv } from "@/lib/env";

/**
 * Supabase server client.
 *
 * Returns null when the project is not connected, so server components can
 * branch to the seeded fixtures instead of failing.
 */
export async function createClient() {
  const env = getEnv();
  if (!env.supabaseUrl || !env.supabaseAnonKey) return null;

  const cookieStore = await cookies();

  return createServerClient<never>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components cannot always write cookies; the middleware
          // refreshes the session instead.
        }
      },
    },
  });
}
