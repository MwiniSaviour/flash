import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const state = vi.hoisted(() => ({
  rows: {
    orders: [] as Record<string, unknown>[],
    rides: [] as Record<string, unknown>[],
    parcels: [] as Record<string, unknown>[],
    notifications: [] as Record<string, unknown>[],
  },
  eqCalls: [] as string[],
}));

vi.mock("@/lib/env", () => ({
  getEnv: () => ({ supabaseServiceRoleKey: "server-only-key" }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (_column: string, value: string) => {
          state.eqCalls.push(value);
          return {
            order: async () => ({
              data: state.rows[table as keyof typeof state.rows] ?? [],
              error: null,
            }),
          };
        },
      }),
    }),
  }),
}));

import { buildLiveDigest } from "./stream";

describe("buildLiveDigest", () => {
  beforeEach(() => {
    state.eqCalls = [];
    state.rows = { orders: [], rides: [], parcels: [], notifications: [] };
  });

  it("scopes every query to the signed-in user and is deterministic", async () => {
    state.rows.orders = [{ id: "ord-1", status: "preparing", rider_id: null }];

    const first = await buildLiveDigest("user-1");
    const second = await buildLiveDigest("user-1");

    expect(first).toBe(second);
    expect(state.eqCalls).toEqual(Array(8).fill("user-1"));
  });

  it("changes when a scoped row changes", async () => {
    state.rows.orders = [{ id: "ord-1", status: "preparing", rider_id: null }];
    const before = await buildLiveDigest("user-1");

    state.rows.orders = [{ id: "ord-1", status: "on the way", rider_id: "drv-1" }];
    expect(await buildLiveDigest("user-1")).not.toBe(before);
  });

  it("does not include raw row text in the digest", async () => {
    state.rows.notifications = [{ id: "note-1", title: "Private customer name" }];
    const digest = await buildLiveDigest("user-1");
    expect(digest).not.toContain("Private");
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
  });
});
