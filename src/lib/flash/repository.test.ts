import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => null,
}));
vi.mock("@/lib/auth/server", () => ({
  currentRole: async () => "customer",
  currentUserId: async () => null,
  currentClerkIdentity: async () => null,
}));
vi.mock("@/lib/dispatch/client", () => ({
  dispatchConfigured: () => false,
  getDispatchJob: async () => null,
}));
vi.mock("@/lib/notifications/service", () => ({
  notifyCompletion: async () => {},
}));
vi.mock("@/lib/payments/service", () => ({
  releaseDriverPayoutForDispatch: async () => {},
}));

import * as repository from "./repository";

const reads: [string, () => Promise<unknown>][] = [
  ["listEvents", () => repository.listEvents()],
  ["getEventBySlug", () => repository.getEventBySlug("slug")],
  ["getEventById", () => repository.getEventById("id")],
  ["getFeaturedEvent", () => repository.getFeaturedEvent()],
  ["getUpcomingEvents", () => repository.getUpcomingEvents()],
  ["getTrendingEvents", () => repository.getTrendingEvents()],
  ["listRestaurants", () => repository.listRestaurants()],
  ["getRestaurantBySlug", () => repository.getRestaurantBySlug("slug")],
  ["getTrendingRestaurants", () => repository.getTrendingRestaurants()],
  ["getRideQuote", () => repository.getRideQuote()],
  ["getSavedPlaces", () => repository.getSavedPlaces()],
  ["listTickets", () => repository.listTickets()],
  ["listTicketRequests", () => repository.listTicketRequests()],
  ["listUserPayments", () => repository.listUserPayments()],
  ["listBookings", () => repository.listBookings()],
  ["getActiveOrder", () => repository.getActiveOrder()],
  ["getCurrentUser", () => repository.getCurrentUser()],
  ["listMyKitchens", () => repository.listMyKitchens()],
  ["listKitchen", () => repository.listKitchen("business")],
  ["listBusinesses", () => repository.listBusinesses()],
  ["isBusinessAccount", () => repository.isBusinessAccount()],
  ["listMyEvents", () => repository.listMyEvents()],
  ["listEventsForBusiness", () => repository.listEventsForBusiness("business")],
  ["listIncomingOrders", () => repository.listIncomingOrders("kitchen")],
  ["listIncomingTickets", () => repository.listIncomingTickets(["event"])],
  ["listCustomers", () => repository.listCustomers("business", "restaurant")],
  ["listDeliveries", () => repository.listDeliveries()],
  ["listPastDeliveries", () => repository.listPastDeliveries()],
  ["getDelivery", () => repository.getDelivery("id")],
];

describe("repository reads", () => {
  it.each(reads)("%s fails loudly without a database", async (_name, read) => {
    await expect(read()).rejects.toThrow("Database is not configured");
  });
});
