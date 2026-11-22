import { NextResponse } from "next/server";

import { listNotificationIds, markPersistedRead } from "@/lib/notifications/inbox";

export async function POST(request: Request) {
  let body: { ids?: unknown; all?: unknown };
  try {
    body = (await request.json()) as { ids?: unknown; all?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const ids = Array.isArray(body.ids)
    ? body.ids
        .filter((id): id is string => typeof id === "string" && id.startsWith("ntf:"))
        .map((id) => id.slice(4))
    : [];
  if (body.all === true) {
    await markPersistedRead(await listNotificationIds());
  } else if (ids.length) {
    await markPersistedRead(ids);
  }
  return NextResponse.json({ ok: true });
}
