import "server-only";

import { currentClerkIdentity } from "@/lib/auth/server";
import type { AdminClient } from "@/lib/supabase/admin";

import type { ProfileRow } from "./rows";

/**
 * The profile row.
 *
 * Clerk owns identity; this table owns the product profile. A signed-in
 * customer has no row until the app writes one, and every write that carries
 * a `user_id` needs that row to exist first — the foreign key says so. So the
 * profile is created the moment a customer appears, from Clerk's own details.
 */
export async function ensureProfile(
  client: AdminClient,
  userId: string,
): Promise<ProfileRow> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as ProfileRow;

  const identity = await currentClerkIdentity();
  const name = identity?.name ?? "ScalDive customer";

  const { data: created, error: insertError } = await client
    .from("profiles")
    .insert({
      id: userId,
      name,
      email: identity?.email ?? "",
      avatar_src: identity?.avatarUrl ?? "",
      avatar_alt: identity ? `Portrait of ${name}, the signed-in customer` : "",
      member_since: new Date().toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      }),
      notifications_enabled: true,
    })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return created as ProfileRow;
}
