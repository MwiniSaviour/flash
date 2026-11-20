import { headers } from "next/headers";

import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const h = await headers();
  return Response.json({
    host: h.get("host"),
    forwardedHost: h.get("x-forwarded-host"),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    adminHost: getEnv().adminHost,
  });
}
