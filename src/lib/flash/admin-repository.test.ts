import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => null,
}));

import * as adminRepository from "./admin-repository";

const reads: [string, () => Promise<unknown>][] = [
  ["getAdminOverview", () => adminRepository.getAdminOverview(30)],
  ["listApplications", () => adminRepository.listApplications()],
  ["listAdminPayments", () => adminRepository.listAdminPayments()],
  ["listAdminBookings", () => adminRepository.listAdminBookings()],
  ["listPayouts", () => adminRepository.listPayouts()],
  ["reassignRideDriver", () => adminRepository.reassignRideDriver("ride-1", "driver-1")],
  ["listDrivers", () => adminRepository.listDrivers()],
];

describe("admin repository reads", () => {
  it.each(reads)("%s fails loudly without a database", async (_name, read) => {
    await expect(read()).rejects.toThrow("Database is not configured");
  });
});
