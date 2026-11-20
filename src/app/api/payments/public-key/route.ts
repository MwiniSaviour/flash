import { NextResponse } from "next/server";

import { getEnv } from "@/lib/env";

/** The browser needs only the publishable key for the Paystack popup. */
export async function GET() {
  const key = getEnv().paystackPublicKey;

  if (!key?.startsWith("pk_")) {
    return NextResponse.json({ error: "Paystack is not configured." }, { status: 503 });
  }

  return NextResponse.json({ key });
}
