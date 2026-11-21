"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/auth";
import { businesses } from "@/lib/flash/data/business";
import { DEMO_SETTINGS } from "@/lib/payments/commission";
import { createAdminClient } from "@/lib/supabase/admin";
import { reassignRideDriver } from "@/lib/flash/admin-repository";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

/** Approve or decline a business application. */
export async function decideApplication(
  businessId: string,
  decision: "approved" | "declined",
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "You do not have access to this action." };

  const client = createAdminClient();
  const decidedAt = new Date().toISOString();

  if (!client) {
    const row = businesses.find((business) => business.id === businessId);
    if (!row) return { ok: false, error: "That application is no longer here." };
    row.status = decision;
    row.decidedAt = decidedAt;
    revalidatePath("/admin");
    revalidatePath("/admin/approvals");
    return { ok: true };
  }

  const { error } = await client
    .from("businesses")
    .update({ status: decision, decided_at: decidedAt })
    .eq("id", businessId);

  if (error) return { ok: false, error: "The decision could not be saved." };

  revalidatePath("/admin");
  revalidatePath("/admin/approvals");
  return { ok: true };
}

/** Update the platform's commission rates and payout hold window. */
export async function updatePlatformSettings(input: {
  goodsCommissionBps: number;
  selfDeliveryGoodsCommissionBps: number;
  deliveryCommissionBps: number;
  payoutHoldHours: number;
  freeEventAttendeeFeePesewas: number;
  ridePerKmPesewas: number;
  parcelPerKmPesewas: number;
  deliveryPerKmPesewas: number;
  deliveryBaseKm: number;
}): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "You do not have access to this action." };

  const values = [
    input.goodsCommissionBps,
    input.selfDeliveryGoodsCommissionBps,
    input.deliveryCommissionBps,
    input.payoutHoldHours,
    input.freeEventAttendeeFeePesewas,
    input.ridePerKmPesewas,
    input.parcelPerKmPesewas,
    input.deliveryPerKmPesewas,
    input.deliveryBaseKm,
  ];

  if (values.some((value) => !Number.isInteger(value) || value < 0)) {
    return { ok: false, error: "Every value must be a whole number." };
  }
  if (input.payoutHoldHours > 720) {
    return { ok: false, error: "The hold window cannot exceed 720 hours." };
  }
  if (
    input.goodsCommissionBps > 10000 ||
    input.selfDeliveryGoodsCommissionBps > 10000 ||
    input.deliveryCommissionBps > 10000
  ) {
    return { ok: false, error: "A rate cannot exceed 100 percent." };
  }

  const client = createAdminClient();
  if (!client) {
    Object.assign(DEMO_SETTINGS, input);
    revalidatePath("/admin/settings");
    return { ok: true };
  }

  const { error } = await client
    .from("platform_settings")
    .update({
      goods_commission_bps: input.goodsCommissionBps,
      self_delivery_goods_commission_bps: input.selfDeliveryGoodsCommissionBps,
      delivery_commission_bps: input.deliveryCommissionBps,
      payout_hold_hours: input.payoutHoldHours,
      free_event_attendee_fee_pesewas: input.freeEventAttendeeFeePesewas,
      ride_per_km_pesewas: input.ridePerKmPesewas,
      parcel_per_km_pesewas: input.parcelPerKmPesewas,
      delivery_per_km_pesewas: input.deliveryPerKmPesewas,
      delivery_base_km: input.deliveryBaseKm,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "platform");

  if (error) return { ok: false, error: "The settings could not be saved." };

  revalidatePath("/admin/settings");
  return { ok: true };
}

/** Decide a sold-out ticket request from the platform console. */
export async function decideTicketRequestAsAdmin(input: {
  requestId: string;
  status: "fulfilled" | "declined";
}): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "You do not have access to this action." };

  const client = createAdminClient();
  if (!client) return { ok: true };

  const { error } = await client
    .from("ticket_requests")
    .update({ status: input.status, decided_at: new Date().toISOString() })
    .eq("id", input.requestId);

  if (error) return { ok: false, error: "The decision could not be saved." };

  revalidatePath("/admin/requests");
  return { ok: true };
}

/** Reassign a ride to a different driver. */
export async function reassignRide(rideId: string, driverId: string): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "You do not have access to this action." };

  const result = await reassignRideDriver(rideId, driverId);
  if (!result.ok) return { ok: false, error: result.error ?? "The reassignment could not be saved." };

  revalidatePath("/admin/bookings");
  return { ok: true };
}
