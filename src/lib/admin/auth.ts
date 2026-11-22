import "server-only";

import { currentUser } from "@clerk/nextjs/server";

import { getEnv } from "@/lib/env";
import { roleOf } from "@/lib/flash/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminIdentity = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
};

/**
 * The one gate in front of every admin page and admin read.
 *
 * Clerk is the authority for who is an admin: the role is read from the
 * signed-in user's public metadata. A mirrored `profiles.role` row is accepted
 * when Supabase is connected. Nothing here trusts a client flag, and keyless
 * mode has no admin at all.
 */
export async function requireAdmin(): Promise<AdminIdentity | null> {
  if (!getEnv().clerkPublishableKey) return null;

  const user = await currentUser();
  if (!user) return null;

  const identity: AdminIdentity = {
    id: user.id,
    name: user.fullName ?? [user.firstName, user.lastName].filter(Boolean).join(" ") ?? "Admin",
    email: user.primaryEmailAddress?.emailAddress ?? "",
    avatarUrl: user.imageUrl,
  };

  const clerkRole = roleOf((user.publicMetadata as { role?: unknown } | undefined)?.role);
  if (clerkRole === "admin") return identity;

  const client = createAdminClient();
  if (client) {
    const { data } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (data?.role === "admin") return identity;
  }

  return null;
}
