import { createBrowserClient } from "@supabase/ssr";

import { getEnv, hasSupabasePublicEnv } from "@/lib/env";

/**
 * Supabase browser client.
 *
 * The app runs on seeded fixtures until the project is connected. When the
 * public URL and anon key are present the same screens read from Postgres; when
 * they are not, the client is simply absent and the repository keeps serving
 * demo data.
 */
export function isSupabaseConfigured(): boolean {
  return hasSupabasePublicEnv();
}

export function createClient() {
  const env = getEnv();
  if (!env.supabaseUrl || !env.supabaseAnonKey) return null;

  return createBrowserClient<never>(env.supabaseUrl, env.supabaseAnonKey);
}
