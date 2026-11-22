import type { NotificationRefType } from "./types";

const money = (cedis: number) => `GHS ${cedis.toFixed(2)}`;

export function notificationHref(
  refType: NotificationRefType | null | undefined,
  refId: string | null | undefined,
): string {
  if (refType && refId) {
    const path: Record<NotificationRefType, string> = {
      order: "orders",
      ticket: "tickets",
      ride: "rides",
      parcel: "parcels",
    };
    return `/${path[refType]}/${encodeURIComponent(refId)}`;
  }
  return "/profile/notifications";
}

export function purchaseCopy(refType: NotificationRefType, reference: string, total: number) {
  const title = refType === "ticket" ? "Booking confirmed" : "Order confirmed";
  return {
    title,
    body: `${money(total)} · ${reference}. We'll update you as it moves.`,
    email: `${title}.\n\nReference ${reference} · ${money(total)}.\n\nThank you for choosing Flash.`,
  };
}

export function vendorOrderCopy(restaurant: string, itemCount: number, orderNumber: string) {
  const noun = `item${itemCount === 1 ? "" : "s"}`;
  return {
    title: "New order received",
    body: `${itemCount} ${noun} on order #${orderNumber} at ${restaurant}.`,
    email: `A new order (#${orderNumber}) with ${itemCount} ${noun} is waiting at ${restaurant}.`,
  };
}

export function managerSaleCopy(event: string, tier: string, quantity: number) {
  const noun = `ticket${quantity === 1 ? "" : "s"}`;
  return {
    title: "New ticket sale",
    body: `${quantity} × ${tier} for ${event} sold.`,
    email: `${quantity} ${noun} (${tier}) were sold for ${event}.`,
  };
}

export function paymentCopy(total: number, reference: string) {
  return {
    title: "Payment received",
    body: `${money(total)} received for ${reference}.`,
    email: `We received ${money(total)} for ${reference}. Your Flash payment is confirmed.`,
  };
}

export function completionCopy(refType: NotificationRefType, reference: string) {
  const order = refType === "order";
  const title = order ? "Order completed" : "Booking completed";
  return {
    title,
    body: `${reference} is complete. Thank you for using Flash.`,
    email: `${reference} is now complete.\n\nThank you for ${order ? "ordering" : "booking"} with Flash.`,
  };
}
