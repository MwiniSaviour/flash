import { clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { getEnv } from "@/lib/env";
import { DEFAULT_ROLE, roleOf } from "@/lib/flash/roles";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Clerk → PostgreSQL.
 *
 * Clerk owns identity; this table owns the product profile. The webhook is the
 * reliable path: a customer has a profile before their first write, whether or
 * not they ever open the profile screen.
 *
 * Every request is verified with svix before its body is trusted. Flash has no
 * Clerk keys in the demo, so the endpoint reports that it is not configured
 * rather than accepting anything.
 */

type ClerkUser = {
  id?: string;
  public_metadata?: { role?: unknown } | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  primary_email_address_id?: string | null;
  email_addresses?: { id: string; email_address: string }[];
};

type ClerkWebhookEvent = { type: string; data: ClerkUser };

function nameOf(user: ClerkUser): string {
  return (
    user.full_name ??
    [user.first_name, user.last_name].filter(Boolean).join(" ") ??
    "Flash customer"
  );
}

function emailOf(user: ClerkUser): string {
  return (
    user.email_addresses?.find((entry) => entry.id === user.primary_email_address_id)
      ?.email_address ??
    user.email_addresses?.[0]?.email_address ??
    ""
  );
}

export async function POST(request: Request) {
  const secret = getEnv().clerkWebhookSecret;
  if (!secret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const incoming = await headers();
  const svixId = incoming.get("svix-id");
  const svixTimestamp = incoming.get("svix-timestamp");
  const svixSignature = incoming.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing signature headers." }, { status: 400 });
  }

  const body = await request.text();

  let event: ClerkWebhookEvent;
  try {
    event = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as unknown as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "user.created") {
    const user = event.data;
    if (!user.id) {
      return NextResponse.json({ error: "No user id in the event." }, { status: 400 });
    }

    // Give every new account a labelled role. It is public metadata, so the
    // "role" field is visible on the user's Clerk Dashboard profile.
    const clerk = await clerkClient();
    const role = roleOf(user.public_metadata?.role ?? DEFAULT_ROLE);
    await clerk.users.updateUserMetadata(user.id, { publicMetadata: { role } });
  }

  const client = createAdminClient();

  if (event.type === "user.created" || event.type === "user.updated") {
    const user = event.data;
    if (!user.id) {
      return NextResponse.json({ error: "No user id in the event." }, { status: 400 });
    }

    if (!client) return NextResponse.json({ received: true });

    const { data: existing, error: readError } = await client
      .from("profiles")
      .select("member_since, notifications_enabled")
      .eq("id", user.id)
      .maybeSingle();

    if (readError) throw readError;

    const name = nameOf(user);
    const avatar = user.image_url ?? "";

    const { error } = await client.from("profiles").upsert(
      {
        id: user.id,
        name,
        email: emailOf(user),
        avatar_src: avatar,
        avatar_alt: avatar ? `Portrait of ${name}, the signed-in customer` : "",
        member_since:
          existing?.member_since ??
          new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
        notifications_enabled: existing?.notifications_enabled ?? true,
      },
      { onConflict: "id" },
    );

    if (error) throw error;
    return NextResponse.json({ received: true });
  }

  if (event.type === "user.deleted") {
    if (!client) return NextResponse.json({ received: true });
    if (!event.data.id) {
      return NextResponse.json({ error: "No user id in the event." }, { status: 400 });
    }

    const { error } = await client
      .from("profiles")
      .delete()
      .eq("id", event.data.id);

    if (error) throw error;
    return NextResponse.json({ received: true });
  }

  // An event Flash does not use is still a valid event.
  return NextResponse.json({ received: true });
}
