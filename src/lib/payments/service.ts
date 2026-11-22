import "server-only";

import { currentUserId } from "@/lib/auth/server";
import { notifyCompletion, notifyPaymentReceived } from "@/lib/notifications/service";
import { createAdminClient } from "@/lib/supabase/admin";

import { computeCommission, platformSettings } from "./commission";
import {
  initPaystackTransaction,
  newReference,
  paystackConfigured,
  requestTransfer,
  verifyPaystackTransaction,
  type PaystackWebhookPayload,
} from "./paystack";

/**
 * Checkout and payouts.
 *
 * The platform collects the whole charge. Commission is computed here from the
 * stored settings, and seller/driver payouts are created pending — the driver
 * one is only released after the customer confirms delivery.
 */

export type CheckoutStart = {
  reference: string;
  checkoutUrl: string | null;
  accessCode: string | null;
  amountPesewas: number;
  email: string;
  demo: boolean;
};

function pesewas(cedis: number): number {
  return Math.max(0, Math.round(cedis * 100));
}

/** Creates the payment record and returns Paystack's hosted checkout URL. */
export async function startCheckout(input: {
  kind: "order" | "ticket" | "ride" | "parcel";
  userId: string;
  email: string;
  itemsCedis: number;
  deliveryFeeCedis: number;
  selfDelivery: boolean;
  orderId?: string;
  ticketId?: string;
  rideId?: string;
  parcelId?: string;
}): Promise<CheckoutStart> {
  if (!paystackConfigured()) {
    return { reference: "", checkoutUrl: null, accessCode: null, amountPesewas: 0, email: "", demo: true };
  }

  const client = createAdminClient();
  if (!client) return { reference: "", checkoutUrl: null, accessCode: null, amountPesewas: 0, email: "", demo: true };

  const commission = computeCommission({
    itemsPesewas: pesewas(input.itemsCedis),
    deliveryFeePesewas: pesewas(input.deliveryFeeCedis),
    selfDelivery: input.selfDelivery,
    settings: await platformSettings(),
  });

  const reference = newReference("FLP");

  const { error } = await client.from("payments").insert({
    id: reference,
    user_id: input.userId,
    kind: input.kind,
    reference,
    provider: "paystack",
    status: "pending",
    amount_pesewas: commission.totalChargedPesewas,
    commission_pesewas: commission.totalPesewas,
    seller_net_pesewas: commission.sellerNetPesewas,
    driver_pesewas: commission.driverPesewas,
    order_id: input.orderId ?? null,
    ticket_id: input.ticketId ?? null,
    ride_id: input.rideId ?? null,
    parcel_id: input.parcelId ?? null,
  });

  if (error) throw error;

  const result = await initPaystackTransaction({
    amountPesewas: commission.totalChargedPesewas,
    email: input.email,
    reference,
    callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/payments/return`,
  });

  if (!result.ok || !result.checkoutUrl) {
    await client.from("payments").update({ status: "failed" }).eq("id", reference);
    throw new Error(result.message || "We could not start the payment.");
  }

  return {
    reference,
    checkoutUrl: result.checkoutUrl,
    accessCode: result.accessCode,
    amountPesewas: commission.totalChargedPesewas,
    email: input.email,
    demo: false,
  };
}

/**
 * Marks a verified charge as paid and creates the held payout rows.
 * Idempotent: a second webhook delivery does nothing.
 */
export async function fulfilPayment(payload: PaystackWebhookPayload): Promise<boolean> {
  const reference = payload.data?.reference;
  if (!reference || payload.event !== "charge.success" || payload.data?.status !== "success") {
    return false;
  }

  const client = createAdminClient();
  if (!client) return false;

  const { data: payment, error } = await client
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (error) throw error;
  if (!payment || payment.status === "success") return false;

  // Never trust the webhook alone: verify against Paystack and check the amount.
  const verified = await verifyPaystackTransaction(reference);
  if (
    verified.status !== "success" ||
    verified.amountPesewas === null ||
    verified.amountPesewas !== payment.amount_pesewas
  ) {
    return false;
  }

  const { error: paidError } = await client
    .from("payments")
    .update({ status: "success", paid_at: new Date().toISOString() })
    .eq("id", payment.id);

  if (paidError) throw paidError;

  if (payment.order_id) {
    await client
      .from("orders")
      .update({
        payment_reference: reference,
        commission_pesewas: payment.commission_pesewas,
      })
      .eq("id", payment.order_id);
  }

  if (payment.ticket_id) {
    await client
      .from("tickets")
      .update({
        payment_reference: reference,
        commission_pesewas: payment.commission_pesewas,
        status: "confirmed",
      })
      .eq("id", payment.ticket_id);
  }

  const refType = payment.order_id
    ? "order"
    : payment.ticket_id
      ? "ticket"
      : payment.ride_id
        ? "ride"
        : "parcel";
  const refId =
    payment.order_id ?? payment.ticket_id ?? payment.ride_id ?? payment.parcel_id ?? payment.id;

  void notifyPaymentReceived({
    userId: payment.user_id,
    refType,
    refId,
    total: payment.amount_pesewas / 100,
    reference,
  });

  if (refType !== "order") {
    void notifyCompletion({ userId: payment.user_id, refType, refId, reference });
  }

  // Both payouts are held until delivery is confirmed. A ticket has no driver,
  // so its seller payout can be released immediately.
  if (payment.seller_net_pesewas > 0) {
    const { data: order } = payment.order_id
      ? await client
          .from("orders")
          .select("restaurant_id")
          .eq("id", payment.order_id)
          .maybeSingle()
      : { data: null };

    const { data: kitchen } = order
      ? await client
          .from("restaurants")
          .select("owner_user_id")
          .eq("id", order.restaurant_id)
          .maybeSingle()
      : { data: null };

    const { data: ticket } = payment.ticket_id
      ? await client
          .from("tickets")
          .select("event_id")
          .eq("id", payment.ticket_id)
          .maybeSingle()
      : { data: null };

    const { data: event } = ticket
      ? await client
          .from("events")
          .select("owner_user_id")
          .eq("id", ticket.event_id)
          .maybeSingle()
      : { data: null };

    await client.from("payouts").insert({
      id: `pay_seller_${payment.id}`,
      payment_id: payment.id,
      user_id:
        kitchen?.owner_user_id ?? event?.owner_user_id ?? payment.payer_user_id ?? payment.user_id,
      kind: "seller",
      amount_pesewas: payment.seller_net_pesewas,
      status: payment.order_id ? "pending" : "processing",
      reason: "Settlement from a paid purchase",
    });
  }

  if (payment.driver_pesewas > 0) {
    await client.from("payouts").insert({
      id: `pay_driver_${payment.id}`,
      payment_id: payment.id,
      user_id: "driver",
      kind: "driver",
      amount_pesewas: payment.driver_pesewas,
      status: "pending",
      reason: "Delivery fee, released on confirmation",
    });
  }

  if (!payment.order_id && payment.seller_net_pesewas > 0) {
    await releasePayout(`pay_seller_${payment.id}`, null);
  }

  return true;
}

/** Releases a single held payout through Paystack. */
async function releasePayout(payoutId: string, recipient: string | null): Promise<boolean> {
  const client = createAdminClient();
  if (!client) return false;

  const { data: payout, error } = await client
    .from("payouts")
    .select("*")
    .eq("id", payoutId)
    .maybeSingle();

  if (error) throw error;
  if (!payout || payout.status === "paid" || payout.status === "processing") return false;

  const code =
    recipient ??
    (payout.kind === "seller"
      ? await sellerRecipient(client, payout.user_id)
      : await driverRecipient(client, payout.payment_id));

  if (!code) return false;

  await client
    .from("payouts")
    .update({ status: "processing", recipient_code: code })
    .eq("id", payoutId);

  const transfer = await requestTransfer({
    recipient: code,
    amountPesewas: payout.amount_pesewas,
    reason: payout.reason || "Flash payout",
  });

  if (!transfer.ok) {
    await client.from("payouts").update({ status: "failed" }).eq("id", payoutId);
    return false;
  }

  await client
    .from("payouts")
    .update({ status: "paid", transfer_code: transfer.transferCode ?? "", paid_at: new Date().toISOString() })
    .eq("id", payoutId);

  return true;
}

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

async function sellerRecipient(client: AdminClient, userId: string): Promise<string | null> {
  const { data: business } = await client
    .from("businesses")
    .select("transfer_recipient_code")
    .eq("user_id", userId)
    .eq("settlement_verified", true)
    .maybeSingle();

  if (business?.transfer_recipient_code) return business.transfer_recipient_code;

  const { data: profile } = await client
    .from("profiles")
    .select("transfer_recipient_code")
    .eq("id", userId)
    .maybeSingle();

  return profile?.transfer_recipient_code || null;
}

async function driverRecipient(client: AdminClient, paymentId: string): Promise<string | null> {
  const { data: payment } = await client
    .from("payments")
    .select("order_id, ride_id, parcel_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment) return null;

  // The order path is unchanged; rides and parcels carry the same driver id in
  // their own table, so the payout lookup has one shape for all three products.
  let driverId: string | null = null;

  if (payment.order_id) {
    const { data: order } = await client
      .from("orders")
      .select("rider_id")
      .eq("id", payment.order_id)
      .maybeSingle();
    driverId = order?.rider_id ?? null;
  } else if (payment.ride_id) {
    const { data: ride } = await client
      .from("rides")
      .select("rider_id")
      .eq("id", payment.ride_id)
      .maybeSingle();
    driverId = ride?.rider_id ?? null;
  } else if (payment.parcel_id) {
    const { data: parcel } = await client
      .from("parcels")
      .select("courier_id")
      .eq("id", payment.parcel_id)
      .maybeSingle();
    driverId = parcel?.courier_id ?? null;
  }

  if (!driverId) return null;

  const { data: driver } = await client
    .from("drivers")
    .select("payout_recipient_code")
    .eq("id", driverId)
    .maybeSingle();

  return driver?.payout_recipient_code || null;
}

/**
 * The engine's `delivered` event releases a ride or parcel's held driver payout.
 * Idempotent: a repeated poll or webhook finds no pending payout to release.
 */
export async function releaseDriverPayoutForDispatch(input: {
  jobId: string;
}): Promise<boolean> {
  const client = createAdminClient();
  if (!client) return false;

  const [ride, parcel] = await Promise.all([
    client.from("rides").select("id").eq("dispatch_job_id", input.jobId).maybeSingle(),
    client.from("parcels").select("id").eq("dispatch_job_id", input.jobId).maybeSingle(),
  ]);

  const linked = [
    { column: "ride_id" as const, id: ride.data?.id ?? null },
    { column: "parcel_id" as const, id: parcel.data?.id ?? null },
  ].filter((entry): entry is { column: "ride_id" | "parcel_id"; id: string } => Boolean(entry.id));

  if (linked.length === 0) return false;

  let released = false;
  for (const entry of linked) {
    const { data: payments } = await client
      .from("payments")
      .select("id, status")
      .eq(entry.column, entry.id);

    for (const payment of payments ?? []) {
      if (payment.status !== "success") continue;

      const { data: payouts } = await client
        .from("payouts")
        .select("id")
        .eq("payment_id", payment.id)
        .eq("status", "pending");

      for (const payout of payouts ?? []) {
        if (await releasePayout(payout.id, null)) released = true;
      }
    }
  }

  return released;
}

/**
 * The customer confirms delivery. Only then does the driver get paid, and the
 * seller's held net is released too.
 */
export async function confirmDelivery(input: {
  orderId: string;
  userId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const client = createAdminClient();
  if (!client) return { ok: true };

  const { data: order, error } = await client
    .from("orders")
    .select("id, user_id, delivery_confirmed_at")
    .eq("id", input.orderId)
    .maybeSingle();

  if (error) throw error;
  if (!order || order.user_id !== input.userId) {
    return { ok: false, error: "That order is not yours." };
  }

  if (!order.delivery_confirmed_at) {
    await client
      .from("orders")
      .update({ delivery_confirmed_at: new Date().toISOString(), status: "delivered" })
      .eq("id", order.id);
  }

  const { data: payment } = await client
    .from("payments")
    .select("id, status")
    .eq("order_id", order.id)
    .maybeSingle();

  if (!payment || payment.status !== "success") return { ok: true };

  const { data: payouts } = await client
    .from("payouts")
    .select("id")
    .eq("payment_id", payment.id)
    .eq("status", "pending");

  for (const payout of payouts ?? []) {
    await releasePayout(payout.id, null);
  }

  return { ok: true };
}

/** Records a cash-on-delivery commission the seller still owes the platform. */
export async function recordCashCommission(input: {
  userId: string;
  itemsCedis: number;
  deliveryFeeCedis: number;
  selfDelivery: boolean;
  orderId?: string;
  ticketId?: string;
  rideId?: string;
  parcelId?: string;
}): Promise<void> {
  const client = createAdminClient();
  if (!client) return;

  const commission = computeCommission({
    itemsPesewas: pesewas(input.itemsCedis),
    deliveryFeePesewas: pesewas(input.deliveryFeeCedis),
    selfDelivery: input.selfDelivery,
    settings: await platformSettings(),
  });

  const reference = newReference("FLC");
  const { error } = await client.from("payments").insert({
    id: reference,
    user_id: input.userId,
    kind: input.ticketId
      ? "ticket"
      : input.rideId
        ? "ride"
        : input.parcelId
          ? "parcel"
          : "order",
    reference,
    provider: "cash",
    status: "cash",
    amount_pesewas: commission.totalChargedPesewas,
    commission_pesewas: commission.totalPesewas,
    seller_net_pesewas: commission.sellerNetPesewas,
    driver_pesewas: commission.driverPesewas,
    order_id: input.orderId ?? null,
    ticket_id: input.ticketId ?? null,
    ride_id: input.rideId ?? null,
    parcel_id: input.parcelId ?? null,
    paid_at: new Date().toISOString(),
  });

  if (error) throw error;
}

/** A signed-out caller never reaches the payout actions. */
export async function payoutCaller(): Promise<string | null> {
  return currentUserId();
}

/**
 * Starts a Paystack charge for a commission the planner owes (typically a free
 * event). The payment row already carries the amount and the payer; only the
 * hosted checkout URL is created here.
 */
export async function startCommissionCheckout(input: {
  paymentId: string;
  email: string;
}): Promise<{ ok: boolean; checkoutUrl: string | null; error?: string }> {
  const client = createAdminClient();
  if (!client) {
    return { ok: false, checkoutUrl: null, error: "No database is connected." };
  }

  const { data: payment, error } = await client
    .from("payments")
    .select("*")
    .eq("id", input.paymentId)
    .maybeSingle();

  if (error) throw error;
  if (!payment) return { ok: false, checkoutUrl: null, error: "That charge is no longer here." };
  if (payment.status === "success") {
    return { ok: false, checkoutUrl: null, error: "That commission is already settled." };
  }

  const amount = Number(payment.amount_pesewas);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, checkoutUrl: null, error: "There is no commission to pay." };
  }

  const reference = newReference("FLC");
  const result = await initPaystackTransaction({
    amountPesewas: amount,
    email: input.email,
    reference,
  });

  if (!result.ok || !result.checkoutUrl) {
    return { ok: false, checkoutUrl: null, error: result.message || "Payment could not start." };
  }

  await client
    .from("payments")
    .update({ reference, status: "pending" })
    .eq("id", input.paymentId);

  return { ok: true, checkoutUrl: result.checkoutUrl };
}
