import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { getEnv } from "@/lib/env";

/**
 * The server session.
 *
 * Flash runs signed-in as the seeded demo customer until Clerk is connected.
 * With Clerk mounted the real session wins, and a signed-out visitor gets
 * nobody at all — one customer's data never leaks into another's screen.
 */

/** The seeded demo customer. Matches the profile row in the demo seed. */
export const DEMO_USER_ID = "usr-saviour-mwini";

/** The signed-in customer's id, or null when nobody is signed in. */
export async function currentUserId(): Promise<string | null> {
  if (!getEnv().clerkPublishableKey) return DEMO_USER_ID;

  const { userId } = await auth();
  return userId ?? null;
}

/** Clerk's own details for the signed-in customer, used to seed a profile row. */
export async function currentClerkIdentity(): Promise<{
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
} | null> {
  if (!getEnv().clerkPublishableKey) return null;

  const user = await currentUser();
  if (!user) return null;

  const name =
    user.fullName ?? [user.firstName, user.lastName].filter(Boolean).join(" ");

  return {
    id: user.id,
    name: name || "Flash customer",
    email: user.primaryEmailAddress?.emailAddress ?? "",
    avatarUrl: user.imageUrl,
  };
}
