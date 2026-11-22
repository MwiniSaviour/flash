import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import {
  completionCopy,
  managerSaleCopy,
  paymentCopy,
  purchaseCopy,
  vendorOrderCopy,
} from "./copy";
import { sendEmail } from "./email";
import { dispatchPush } from "./push";
import type { NotificationRefType, NotifyInput } from "./types";

function mintId(): string {
  return `ntf_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
}

async function emailForUser(userId: string): Promise<string | null> {
  const client = createAdminClient();
  if (!client) return null;
  const { data } = await client.from("profiles").select("email").eq("id", userId).maybeSingle();
  return data?.email ?? null;
}

async function alertsEnabled(userId: string): Promise<boolean> {
  const client = createAdminClient();
  if (!client) return true;
  const { data } = await client
    .from("profiles")
    .select("notifications_enabled")
    .eq("id", userId)
    .maybeSingle();
  return data?.notifications_enabled ?? true;
}

export async function notify(input: NotifyInput): Promise<void> {
  try {
    const client = createAdminClient();
    const id = mintId();
    if (client) {
      const { error } = await client.from("notifications").insert({
        id,
        user_id: input.userId,
        business_id: input.businessId ?? null,
        kind: input.kind,
        title: input.title,
        body: input.body,
        speak_text: input.speakText ?? null,
        priority: input.priority ?? "normal",
        ref_type: input.refType ?? null,
        ref_id: input.refId ?? null,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
    }

    const enabled = await alertsEnabled(input.userId);
    const to = input.email?.to || (await emailForUser(input.userId));
    const [pushStatus, emailStatus] = await Promise.all([
      enabled ? dispatchPush(input, client) : Promise.resolve("skipped" as const),
      enabled && input.sendEmail !== false
        ? sendEmail(to, input.title, input.emailBody ?? input.body)
        : Promise.resolve("skipped" as const),
    ]);

    if (client) {
      await client
        .from("notifications")
        .update({ push_status: pushStatus, email_status: emailStatus })
        .eq("id", id);
    }
  } catch (error) {
    console.error("[notifications] dispatch failed", error);
  }
}

type PurchaseArgs = {
  userId: string;
  refType: NotificationRefType;
  refId: string;
  reference: string;
  total: number;
  email?: { to: string } | null;
};

export async function notifyPurchaseConfirmed(args: PurchaseArgs): Promise<void> {
  const copy = purchaseCopy(args.refType, args.reference, args.total);
  await notify({
    userId: args.userId,
    kind: args.refType === "ticket" ? "booking_confirmed" : "purchase_confirmed",
    title: copy.title,
    body: copy.body,
    emailBody: copy.email,
    refType: args.refType,
    refId: args.refId,
    email: args.email,
  });
}

export async function notifyVendorNewOrder(args: {
  ownerUserId: string;
  businessId: string | null;
  orderId: string;
  restaurant: string;
  itemCount: number;
  orderNumber: string;
}): Promise<void> {
  const copy = vendorOrderCopy(args.restaurant, args.itemCount, args.orderNumber);
  await notify({
    userId: args.ownerUserId,
    businessId: args.businessId,
    kind: "new_order",
    title: copy.title,
    body: copy.body,
    emailBody: copy.email,
    refType: "order",
    refId: args.orderId,
  });
}

export async function notifyManagerNewSale(args: {
  ownerUserId: string;
  businessId: string | null;
  ticketId: string;
  event: string;
  tier: string;
  quantity: number;
}): Promise<void> {
  const copy = managerSaleCopy(args.event, args.tier, args.quantity);
  await notify({
    userId: args.ownerUserId,
    businessId: args.businessId,
    kind: "new_ticket_sale",
    title: copy.title,
    body: copy.body,
    emailBody: copy.email,
    refType: "ticket",
    refId: args.ticketId,
  });
}

export async function notifyPaymentReceived(args: {
  userId: string;
  refType: NotificationRefType;
  refId: string;
  total: number;
  reference: string;
}): Promise<void> {
  const copy = paymentCopy(args.total, args.reference);
  await notify({
    userId: args.userId,
    kind: "payment_received",
    title: copy.title,
    body: copy.body,
    emailBody: copy.email,
    refType: args.refType,
    refId: args.refId,
  });
}

export async function notifyCompletion(args: {
  userId: string;
  businessId?: string | null;
  refType: NotificationRefType;
  refId: string;
  reference: string;
}): Promise<void> {
  const copy = completionCopy(args.refType, args.reference);
  await notify({
    userId: args.userId,
    businessId: args.businessId ?? null,
    kind: args.refType === "order" ? "order_completed" : "booking_completed",
    title: copy.title,
    body: copy.body,
    emailBody: copy.email,
    refType: args.refType,
    refId: args.refId,
  });
}
