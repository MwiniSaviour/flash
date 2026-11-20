import { NextResponse } from "next/server";

import { paystackConfigured, verifyPaystackTransaction } from "@/lib/payments/paystack";
import { fulfilPayment } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Client-side confirmation path.
 *
 * The webhook is authoritative, but it can be delayed or unreachable in local
 * and hosted setups. The browser polls this endpoint after Paystack closes;
 * it re-verifies with Paystack before changing any row, so it cannot be used
 * to fake a payment.
 */
export async function GET(request: Request) {
  if (!paystackConfigured()) {
    return NextResponse.json({ error: "Paystack is not configured." }, { status: 503 });
  }

  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "A reference is required." }, { status: 400 });
  }

  const client = createAdminClient();
  if (!client) {
    return NextResponse.json({ error: "Data store is not configured." }, { status: 503 });
  }

  const verified = await verifyPaystackTransaction(reference);
  if (verified.status !== "success") {
    return NextResponse.json({ status: "pending" });
  }

  const { data: payment } = await client
    .from("payments")
    .select("amount_pesewas, status")
    .eq("reference", reference)
    .maybeSingle();

  if (!payment) return NextResponse.json({ status: "unknown" }, { status: 404 });

  if (verified.amountPesewas !== null && verified.amountPesewas !== payment.amount_pesewas) {
    return NextResponse.json({ status: "amount-mismatch" }, { status: 409 });
  }

  if (payment.status !== "success") {
    await fulfilPayment({
      event: "charge.success",
      data: {
        reference,
        status: "success",
        amount: verified.amountPesewas ?? payment.amount_pesewas,
      },
    });
  }

  return NextResponse.json({ status: "success", reference });
}
