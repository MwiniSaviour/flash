import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasAdminEnv: false,
  createAdminClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ hasDatabaseAdminEnv: () => mocks.hasAdminEnv }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { DEMO_SETTINGS, displaySettings, platformSettings } from "./commission";

beforeEach(() => {
  mocks.hasAdminEnv = false;
  mocks.createAdminClient.mockReturnValue(null);
});

describe("platform settings", () => {
  it("never invents settings without a database", async () => {
    await expect(platformSettings()).rejects.toThrow("Database is not configured");
  });

  it("uses the documented defaults for display-only rates in demo mode", async () => {
    await expect(displaySettings()).resolves.toEqual(DEMO_SETTINGS);
  });

  it("reads the stored row for display when a database is configured", async () => {
    mocks.hasAdminEnv = true;
    mocks.createAdminClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              error: null,
              data: {
                goods_commission_bps: 500,
                self_delivery_goods_commission_bps: 600,
                delivery_commission_bps: 700,
                payout_hold_hours: 24,
                free_event_attendee_fee_pesewas: 100,
                ride_per_km_pesewas: 100,
                parcel_per_km_pesewas: 100,
                delivery_per_km_pesewas: 200,
                delivery_base_km: 3,
              },
            }),
          }),
        }),
      }),
    });

    await expect(displaySettings()).resolves.toMatchObject({ goodsCommissionBps: 500 });
  });
});
