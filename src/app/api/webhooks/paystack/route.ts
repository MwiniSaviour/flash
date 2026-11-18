import { NextResponse } from "next/server";

import { getEnv } from "@/lib/env";
import { fulfilPayment } from "@/lib/payments/service";
import {
  paystackConfigured,
  paystackKey,
  verifyWebhookSignature,
  type PaystackWebhookPayload,
} from "@/lib/payments/paystack";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Paystack webhook.
 *
 * Signature first, then an idempotency ledger, then a server-side verify of
 * the charge before any order or payout is touched. A redelivered event is a
 * no-op; a failed event can be retried by Paystack.
 */

export async function POST(request: Request) {
  if (!paystackConfigured() || !getEnv().paystackWebhookSecret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const raw = await request.arrayBuffer();
  const signature = request.headers.get("x-paystack-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature, paystackKey())) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: PaystackWebhookPayload;
  try {
    payload = JSON.parse(Buffer.from(raw).toString("utf8")) as PaystackWebhookPayload;
  } catch {
    return NextResponse.json({ status: "ignored" });
  }

  const eventId = String(payload.data?.id ?? payload.data?.reference ?? "");
  if (!eventId) return NextResponse.json({ status: "ignored" });

  const client = createAdminClient();
  if (!client) return NextResponse.json({ error: "Data store is not configured." }, { status: 503 });

  const { data: existing } = await client
    .from("paystack_events")
    .select("id, status")
    .eq("id", eventId)
    .maybeSingle();

  if (existing?.status === "processed" || existing?.status === "duplicate") {
    return NextResponse.json({ status: "duplicate" });
  }

  if (!existing) {
    await client.from("paystack_events").insert({
      id: eventId,
      event: payload.event ?? "",
      reference: payload.data?.reference ?? "",
      status: "received",
      payload: payload as unknown as Record<string, unknown>,
    });
  }

  try {
    if (payload.event === "charge.success") {
      const fulfilled = await fulfilPayment(payload);
      await client
        .from("paystack_events")
        .update({ status: fulfilled ? "processed" : "ignored" })
        .eq("id", eventId);
    } else if (payload.event === "transfer.success" || payload.event === "transfer.failed") {
      const code = payload.data?.transfer_code ?? "";
      if (code) {
        await client
          .from("payouts")
          .update({
            status: payload.event === "transfer.success" ? "paid" : "failed",
            paid_at: payload.event === "transfer.success" ? new Date().toISOString() : null,
          })
          .eq("transfer_code", code);
      }
      await client.from("paystack_events").update({ status: "processed" }).eq("id", eventId);
    } else {
      await client.from("paystack_events").update({ status: "ignored" }).eq("id", eventId);
    }
  } catch (error) {
    console.error("[paystack] webhook processing failed", error);
    // Leave the event as "received" so Paystack's redelivery can retry it.
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
