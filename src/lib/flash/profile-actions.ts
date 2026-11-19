"use server";

import { revalidatePath } from "next/cache";

import { currentUserId } from "@/lib/auth/server";
import { ensureProfile } from "@/lib/flash/profile";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProfileActionResult = { ok: true } | { ok: false; error: string };

/** Persist profile fields a customer manages themselves. */
export async function updateProfile(input: { name?: string; email?: string }): Promise<ProfileActionResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage your profile." };

  const name = input.name?.trim();
  if (name !== undefined && !name) return { ok: false, error: "Give the profile a name." };
  if (input.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return { ok: false, error: "That email address is not valid." };
  }

  const client = createAdminClient();
  if (!client) {
    revalidatePath("/profile");
    revalidatePath("/settings");
    return { ok: true };
  }

  await ensureProfile(client, userId);
  const updates: Record<string, string> = {};
  if (name !== undefined) updates.name = name;
  if (input.email !== undefined) updates.email = input.email.trim();
  if (Object.keys(updates).length) {
    const { error } = await client.from("profiles").update(updates).eq("id", userId);
    if (error) return { ok: false, error: "The profile could not be saved." };
  }

  revalidatePath("/profile");
  revalidatePath("/settings");
  return { ok: true };
}

/** Store the customer's alert preference with the profile. */
export async function setNotificationsEnabled(enabled: boolean): Promise<ProfileActionResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to manage notifications." };

  const client = createAdminClient();
  if (!client) {
    revalidatePath("/profile");
    revalidatePath("/settings");
    return { ok: true };
  }

  await ensureProfile(client, userId);
  const { error } = await client
    .from("profiles")
    .update({ notifications_enabled: enabled })
    .eq("id", userId);

  if (error) return { ok: false, error: "The setting could not be saved." };
  revalidatePath("/profile");
  revalidatePath("/settings");
  return { ok: true };
}
