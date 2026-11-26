import { NextResponse } from "next/server";

import { currentUserId } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PLATFORMS = new Set(["web", "fcm", "android", "ios"]);

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token.slice(0, 4096) : "";
  const platform = typeof body.platform === "string" ? body.platform : "";
  if (!token || !PLATFORMS.has(platform)) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }
  const p256dh = typeof body.p256dh === "string" ? body.p256dh.slice(0, 512) : null;
  const auth = typeof body.auth === "string" ? body.auth.slice(0, 512) : null;
  const client = createAdminClient();
  if (client) {
    const { error } = await client.from("notification_tokens").upsert(
      {
        token,
        user_id: userId,
        platform,
        app_id: "flash",
        p256dh,
        auth,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );
    if (error) return NextResponse.json({ error: "Token not saved." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const token = new URL(request.url).searchParams.get("token")?.slice(0, 4096) ?? "";
  const client = createAdminClient();
  if (client && token) {
    await client.from("notification_tokens").delete().eq("token", token).eq("user_id", userId);
  }
  return NextResponse.json({ ok: true });
}
