import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => null }));
vi.mock("@/lib/auth/server", () => ({
  currentUserId: async () => "user-1",
  currentClerkIdentity: async () => null,
}));
vi.mock("./repository", () => ({
  getOwnedBusiness: async (id: string, kind: string) => ({
    id,
    kind,
    status: "approved",
  }),
  getApprovedBusiness: async (kind: string) => ({ id: "biz-1", kind, status: "approved" }),
}));
vi.mock("@/lib/media/cloudinary", () => ({ destroyImage: async () => {} }));
vi.mock("@/lib/payments/paystack", () => ({
  listPaystackBanks: async () => ({ banks: [], momo: [] }),
  createTransferRecipient: async () => ({ ok: true, recipientCode: "REC-1" }),
}));
vi.mock("@/lib/payments/service", () => ({
  startCommissionCheckout: async () => ({ ok: true, checkoutUrl: null }),
}));

import * as actions from "./business-actions";

const writes: [string, () => Promise<unknown>][] = [
  [
    "applyForBusiness",
    () =>
      actions.applyForBusiness({
        kind: "restaurant",
        name: "Kitchen",
        email: "owner@example.com",
        phone: "",
        neighbourhood: "",
        about: "",
      }),
  ],
  [
    "publishMenuItem",
    () =>
      actions.publishMenuItem({
        restaurantId: "rst-1",
        businessId: "biz-1",
        name: "Dish",
        description: "",
        price: 10,
      }),
  ],
  ["setMenuItemPrice", () => actions.setMenuItemPrice({ menuItemId: "mi-1", price: 10 })],
  [
    "setRestaurantDiscount",
    () => actions.setRestaurantDiscount({ restaurantId: "rst-1", percent: 10 }),
  ],
  [
    "publishEvent",
    () =>
      actions.publishEvent({
        businessId: "biz-1",
        title: "Show",
        venue: "Venue",
        neighbourhood: "",
        date: "2026-12-01",
        startTime: "19:00",
        endTime: "22:00",
        tierName: "General Admission",
        price: 10,
        capacity: 100,
      }),
  ],
  ["setTierPrice", () => actions.setTierPrice({ tierId: "tier-1", price: 10 })],
  ["setEventDiscount", () => actions.setEventDiscount({ eventId: "evt-1", percent: 10 })],
  ["confirmOrder", () => actions.confirmOrder({ orderId: "ord-1" })],
  ["completeOrder", () => actions.completeOrder({ orderId: "ord-1" })],
  ["confirmTicket", () => actions.confirmTicket({ ticketId: "tkt-1" })],
  [
    "createMenuItem",
    () =>
      actions.createMenuItem({
        businessId: "biz-1",
        restaurantId: "rst-1",
        name: "Dish",
        description: "",
        tags: "",
        price: 10,
      }),
  ],
  [
    "updateMenuItem",
    () =>
      actions.updateMenuItem({
        businessId: "biz-1",
        menuItemId: "mi-1",
        name: "Dish",
        description: "",
        tags: "",
        price: 10,
      }),
  ],
  ["deleteMenuItem", () => actions.deleteMenuItem({ businessId: "biz-1", menuItemId: "mi-1" })],
  [
    "updateEvent",
    () =>
      actions.updateEvent({
        businessId: "biz-1",
        eventId: "evt-1",
        title: "Show",
        venue: "Venue",
        neighbourhood: "",
        date: "2026-12-01",
        startTime: "19:00",
        endTime: "22:00",
      }),
  ],
  ["closeEvent", () => actions.closeEvent({ businessId: "biz-1", eventId: "evt-1" })],
  [
    "updateTicketTier",
    () =>
      actions.updateTicketTier({
        businessId: "biz-1",
        tierId: "tier-1",
        name: "General Admission",
        price: 10,
        available: 100,
      }),
  ],
  [
    "deleteTicketTier",
    () => actions.deleteTicketTier({ businessId: "biz-1", tierId: "tier-1" }),
  ],
  [
    "saveSettlementDetails",
    () =>
      actions.saveSettlementDetails({
        businessId: "biz-1",
        bankCode: "ACC",
        accountNumber: "0123456789",
        type: "mobile_money",
        accountName: "Owner",
      }),
  ],
  [
    "decideTicketRequest",
    () => actions.decideTicketRequest({ requestId: "req-1", status: "fulfilled" }),
  ],
  ["payCommission", () => actions.payCommission({ paymentId: "pay-1", businessId: "biz-1" })],
];

describe("business actions", () => {
  it.each(writes)("%s fails loudly without a database", async (_name, write) => {
    await expect(write()).rejects.toThrow("Database is not configured");
  });
});
