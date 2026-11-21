import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { activeOrder, tickets } from "@/lib/flash/data/account";
import { businesses, incomingOrders, incomingTickets } from "@/lib/flash/data/business";
import { events } from "@/lib/flash/data/events";
import { restaurants } from "@/lib/flash/data/food";
import { DEMO_TODAY } from "@/lib/flash/format";
import { platformSettings, type PlatformSettings } from "@/lib/payments/commission";

export type AdminActivity = {
  id: string;
  kind: "application" | "order" | "ticket";
  label: string;
  detail: string;
  at: string;
};

export type AdminOverview = {
  customers: number;
  businesses: number;
  pendingApprovals: number;
  orders: number;
  tickets: number;
  bookedValue: number;
  collected: number;
  commission: number;
  series: { label: string; orders: number; tickets: number }[];
  activity: AdminActivity[];
};

export type AdminApplication = {
  id: string;
  name: string;
  kind: string;
  status: string;
  neighbourhood: string;
  createdAt: string;
  decidedAt?: string;
};

export type AdminPayment = {
  id: string;
  reference: string;
  kind: string;
  status: string;
  amount: number;
  commission: number;
  createdAt: string;
};

function buildSeries(
  days: number,
  orderDates: string[],
  ticketDates: string[],
): AdminOverview["series"] {
  const today = new Date(`${DEMO_TODAY}T00:00:00Z`);
  const buckets = new Map<string, { label: string; orders: number; tickets: number }>();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - index);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, {
      label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
      orders: 0,
      tickets: 0,
    });
  }

  for (const at of orderDates) {
    const bucket = buckets.get(at.slice(0, 10));
    if (bucket) bucket.orders += 1;
  }
  for (const at of ticketDates) {
    const bucket = buckets.get(at.slice(0, 10));
    if (bucket) bucket.tickets += 1;
  }

  return [...buckets.values()];
}

function fixtureOverview(days: number): AdminOverview {
  const orders = [activeOrder, ...incomingOrders];
  const allTickets = [...tickets, ...incomingTickets];

  const activity: AdminActivity[] = [
    ...businesses.map((business) => ({
      id: `biz-${business.id}`,
      kind: "application" as const,
      label: business.name,
      detail: `${business.kind} application ${business.status}`,
      at: business.decidedAt ?? business.createdAt,
    })),
    ...orders.map((order) => ({
      id: `ord-${order.id}`,
      kind: "order" as const,
      label: `Order #${order.number}`,
      detail: `${order.status} · ${order.lines.length} item${order.lines.length === 1 ? "" : "s"}`,
      at: order.placedAt,
    })),
    ...allTickets.map((ticket) => ({
      id: `tkt-${ticket.id}`,
      kind: "ticket" as const,
      label: ticket.reference,
      detail: `${ticket.tierName} · ${ticket.quantity} ticket${ticket.quantity === 1 ? "" : "s"}`,
      at: ticket.purchasedAt,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return {
    customers: 1,
    businesses: businesses.length,
    pendingApprovals: businesses.filter((business) => business.status === "pending").length,
    orders: orders.length,
    tickets: allTickets.reduce((total, ticket) => total + ticket.quantity, 0),
    bookedValue: orders.reduce(
      (total, order) => total + order.subtotal - order.discount + order.deliveryFee,
      0,
    ),
    collected: 0,
    commission: 0,
    series: buildSeries(
      days,
      orders.map((order) => order.placedAt),
      allTickets.map((ticket) => ticket.purchasedAt),
    ),
    activity: activity.slice(0, 8),
  };
}

/** Platform-wide figures. Every read is gated by requireAdmin at the caller. */
export async function getAdminOverview(days: number): Promise<AdminOverview> {
  const client = createAdminClient();
  if (!client) return fixtureOverview(days);

  const [profiles, businessRows, orderRows, ticketRows, paymentRows] = await Promise.all([
    client.from("profiles").select("id, created_at, role"),
    client.from("businesses").select("id, name, kind, status, created_at, decided_at"),
    client.from("orders").select("id, number, status, subtotal, discount, delivery_fee, placed_at"),
    client.from("tickets").select("id, reference, tier_name, quantity, status, purchased_at"),
    client.from("payments").select("amount_pesewas, commission_pesewas, status"),
  ]);

  for (const result of [profiles, businessRows, orderRows, ticketRows, paymentRows]) {
    if (result.error) throw result.error;
  }

  const payments = paymentRows.data ?? [];
  const paid = payments.filter((payment) => payment.status === "success" || payment.status === "cash");

  const activity: AdminActivity[] = [
    ...(businessRows.data ?? []).map((row) => ({
      id: `biz-${row.id}`,
      kind: "application" as const,
      label: row.name,
      detail: `${row.kind} application ${row.status}`,
      at: row.decided_at ?? row.created_at,
    })),
    ...(orderRows.data ?? []).map((row) => ({
      id: `ord-${row.id}`,
      kind: "order" as const,
      label: `Order #${row.number}`,
      detail: String(row.status),
      at: row.placed_at,
    })),
    ...(ticketRows.data ?? []).map((row) => ({
      id: `tkt-${row.id}`,
      kind: "ticket" as const,
      label: row.reference,
      detail: `${row.tier_name} · ${row.quantity} ticket${row.quantity === 1 ? "" : "s"}`,
      at: row.purchased_at,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return {
    customers: (profiles.data ?? []).filter((row) => row.role !== "admin").length,
    businesses: (businessRows.data ?? []).length,
    pendingApprovals: (businessRows.data ?? []).filter((row) => row.status === "pending").length,
    orders: (orderRows.data ?? []).length,
    tickets: (ticketRows.data ?? []).reduce((total, row) => total + row.quantity, 0),
    bookedValue: (orderRows.data ?? []).reduce(
      (total, row) => total + row.subtotal - row.discount + row.delivery_fee,
      0,
    ),
    collected: paid.reduce((total, row) => total + row.amount_pesewas, 0) / 100,
    commission: paid.reduce((total, row) => total + row.commission_pesewas, 0) / 100,
    series: buildSeries(
      30,
      (orderRows.data ?? []).map((row) => row.placed_at),
      (ticketRows.data ?? []).map((row) => row.purchased_at),
    ),
    activity: activity.slice(0, 8),
  };
}

export async function listApplications(): Promise<AdminApplication[]> {
  const client = createAdminClient();
  if (!client) return businesses.map((business) => ({ ...business }));

  const { data, error } = await client
    .from("businesses")
    .select("id, name, kind, status, neighbourhood, created_at, decided_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    status: row.status,
    neighbourhood: row.neighbourhood,
    createdAt: row.created_at,
    decidedAt: row.decided_at ?? undefined,
  }));
}

export async function listAdminPayments(): Promise<AdminPayment[]> {
  const client = createAdminClient();
  if (!client) return [];

  const { data, error } = await client
    .from("payments")
    .select("id, reference, kind, status, amount_pesewas, commission_pesewas, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    reference: row.reference,
    kind: row.kind,
    status: row.status,
    amount: row.amount_pesewas / 100,
    commission: row.commission_pesewas / 100,
    createdAt: row.created_at,
  }));
}

export type AdminBooking = {
  id: string;
  kind: "ride" | "parcel" | "order" | "ticket";
  reference: string;
  status: string;
  amount: number;
  commission: number;
  createdAt: string;
  customer: string;
  detail: string;
  driver?: string;
};

export async function listAdminBookings(): Promise<AdminBooking[]> {
  const client = createAdminClient();
  if (!client) return [];

  const [rides, parcels, orders, tickets, payments] = await Promise.all([
    client.from("rides").select("id, number, reference, status, price, user_id, rider_id, requested_at, scheduled_for, pickup, dropoff"),
    client.from("parcels").select("id, tracking_number, status, price, user_id, courier_id, requested_at, pickup, dropoff"),
    client.from("orders").select("id, number, reference, status, subtotal, discount, delivery_fee, user_id, restaurant_id, fulfilment, placed_at, address"),
    client.from("tickets").select("id, reference, tier_name, quantity, status, user_id, unit_price_pesewas, purchased_at, event_id"),
    client.from("payments").select("reference, kind, amount_pesewas, commission_pesewas, status, order_id, ticket_id, ride_id, parcel_id, user_id"),
  ]);

  const rows: AdminBooking[] = [];

  const commissionFor = (kind: string, id: string) => {
    const payment = (payments.data ?? []).find((p) =>
      (kind === "ride" && p.ride_id === id) ||
      (kind === "parcel" && p.parcel_id === id) ||
      (kind === "order" && p.order_id === id) ||
      (kind === "ticket" && p.ticket_id === id),
    );
    return payment ? Number(payment.commission_pesewas ?? 0) / 100 : 0;
  };

  for (const r of rides.data ?? []) {
    rows.push({
      id: r.id,
      kind: "ride",
      reference: r.reference || r.number,
      status: r.status,
      amount: Number(r.price ?? 0),
      commission: commissionFor("ride", r.id),
      createdAt: r.requested_at ?? r.scheduled_for ?? new Date().toISOString(),
      customer: r.user_id,
      detail: `${r.pickup} → ${r.dropoff}${r.scheduled_for ? " (scheduled)" : ""}`,
      driver: r.rider_id ?? undefined,
    });
  }

  for (const p of parcels.data ?? []) {
    rows.push({
      id: p.id,
      kind: "parcel",
      reference: p.tracking_number,
      status: p.status,
      amount: Number(p.price ?? 0),
      commission: commissionFor("parcel", p.id),
      createdAt: p.requested_at,
      customer: p.user_id,
      detail: `${p.pickup} → ${p.dropoff}`,
      driver: p.courier_id ?? undefined,
    });
  }

  for (const o of orders.data ?? []) {
    rows.push({
      id: o.id,
      kind: "order",
      reference: o.reference || o.number,
      status: o.status,
      amount: (Number(o.subtotal ?? 0) - Number(o.discount ?? 0) + Number(o.delivery_fee ?? 0)) / 100,
      commission: commissionFor("order", o.id),
      createdAt: o.placed_at,
      customer: o.user_id,
      detail: `${o.fulfilment} · ${o.address || "collected at kitchen"}`,
    });
  }

  for (const t of tickets.data ?? []) {
    rows.push({
      id: t.id,
      kind: "ticket",
      reference: t.reference,
      status: t.status,
      amount: (Number(t.unit_price_pesewas ?? 0) * Number(t.quantity ?? 1)) / 100,
      commission: commissionFor("ticket", t.id),
      createdAt: t.purchased_at,
      customer: t.user_id,
      detail: `${t.tier_name} × ${t.quantity}`,
    });
  }

  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listPayouts(): Promise<AdminPayment[]> {
  const client = createAdminClient();
  if (!client) return [];

  const { data, error } = await client
    .from("payouts")
    .select("id, transfer_code, kind, status, amount_pesewas, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    reference: row.transfer_code || row.id,
    kind: row.kind,
    status: row.status,
    amount: row.amount_pesewas / 100,
    commission: 0,
    createdAt: row.created_at,
  }));
}

export async function getAdminSettings(): Promise<PlatformSettings> {
  return platformSettings();
}

export function adminCatalogueCounts() {
  return { restaurants: restaurants.length, events: events.length };
}

export async function reassignRideDriver(rideId: string, driverId: string): Promise<{ ok: boolean; error?: string }> {
  const client = createAdminClient();
  if (!client) return { ok: false, error: "No database connected." };

  // Only change the driver. A scheduled ride keeps its scheduled status so the
  // new driver still picks it up at the requested time.
  const { error } = await client
    .from("rides")
    .update({ rider_id: driverId })
    .eq("id", rideId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function listDrivers(): Promise<{ id: string; name: string }[]> {
  const client = createAdminClient();
  if (!client) return [];

  const { data, error } = await client
    .from("drivers")
    .select("id, name")
    .order("name");

  if (error) return [];
  return (data ?? []).map((d) => ({ id: d.id, name: d.name }));
}
