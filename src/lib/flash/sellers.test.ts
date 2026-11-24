import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { listSellers, upsertSeller } from "./sellers";

const state = vi.hoisted(() => ({
  client: null as unknown,
  upsert: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.client,
}));

function clientWith(result: { data?: unknown; error?: { message: string } }): unknown {
  return {
    from: vi.fn(() => ({
      upsert: state.upsert,
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve(result)),
      })),
    })),
  };
}

describe("sellers", () => {
  beforeEach(() => {
    state.client = null;
    state.upsert.mockReset();
  });

  it("rejects when the database is not configured", async () => {
    await expect(
      upsertSeller({ clerkUserId: "user-1", displayName: "A", email: "a@example.test" }),
    ).rejects.toThrow("Database is not configured");
    await expect(listSellers()).rejects.toThrow("Database is not configured");
  });

  it("upserts the exact Clerk identity", async () => {
    state.upsert.mockResolvedValue({ error: null });
    state.client = clientWith({});

    await upsertSeller({
      clerkUserId: "user-1",
      displayName: "Seller One",
      email: "seller1@example.test",
    });

    expect(state.upsert).toHaveBeenCalledWith(
      {
        clerk_user_id: "user-1",
        display_name: "Seller One",
        email: "seller1@example.test",
      },
      { onConflict: "clerk_user_id" },
    );
  });

  it("maps seller rows and rejects provider errors", async () => {
    state.client = clientWith({
      data: [
        {
          clerk_user_id: "user-2",
          display_name: "Seller Two",
          email: "seller2@example.test",
          created_at: "2026-11-24T00:00:00Z",
        },
      ],
    });

    await expect(listSellers()).resolves.toEqual([
      {
        clerkUserId: "user-2",
        displayName: "Seller Two",
        email: "seller2@example.test",
        createdAt: "2026-11-24T00:00:00Z",
      },
    ]);

    state.client = clientWith({ error: { message: "permission denied" } });
    await expect(listSellers()).rejects.toThrow("Could not read sellers: permission denied");
  });
});
