import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userId: "user-1" as string | null,
  cancelDispatchJob: vi.fn(),
  createAdminClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/server", () => ({
  currentUserId: async () => mocks.userId,
  currentClerkIdentity: async () => null,
}));
vi.mock("@/lib/dispatch/client", () => ({
  cancelDispatchJob: mocks.cancelDispatchJob,
  createDispatchJob: vi.fn(),
  dispatchConfigured: () => true,
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/notifications/service", () => ({
  notifyCompletion: vi.fn(),
  notifyManagerNewSale: vi.fn(),
  notifyPurchaseConfirmed: vi.fn(),
  notifyVendorNewOrder: vi.fn(),
}));

import { cancelDeliveryAction } from "./actions";

function clientWith(row: unknown) {
  const update = vi.fn();
  return {
    update,
    client: {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) }),
          }),
        }),
        update: (patch: Record<string, unknown>) => {
          update(patch);
          return { eq: () => ({ eq: async () => ({ error: null }) }) };
        },
      }),
    },
  };
}

describe("cancelDeliveryAction", () => {
  beforeEach(() => {
    mocks.userId = "user-1";
    mocks.cancelDispatchJob.mockReset();
    mocks.createAdminClient.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.cancelDispatchJob.mockResolvedValue({
      jobId: "job-1",
      status: "cancelled",
      task: { status: "cancelled" },
    });
  });

  it("fails loudly without a database", async () => {
    mocks.createAdminClient.mockReturnValue(null);
    await expect(cancelDeliveryAction({ id: "ride-1", kind: "ride" })).rejects.toThrow(
      "Database is not configured",
    );
  });

  it("rejects a booking owned by another customer", async () => {
    const { client } = clientWith({ id: "ride-1", user_id: "someone-else", status: "requested" });
    mocks.createAdminClient.mockReturnValue(client);
    await expect(cancelDeliveryAction({ id: "ride-1", kind: "ride" })).resolves.toEqual({
      ok: false,
      error: "That booking is not yours to cancel.",
    });
    expect(mocks.cancelDispatchJob).not.toHaveBeenCalled();
  });

  it("cancels the dispatch job before marking the local ride cancelled", async () => {
    const { client, update } = clientWith({
      id: "ride-1",
      user_id: "user-1",
      status: "requested",
      dispatch_job_id: "job-1",
      dispatch_task_status: "offered",
    });
    mocks.createAdminClient.mockReturnValue(client);

    await expect(cancelDeliveryAction({ id: "ride-1", kind: "ride" })).resolves.toEqual({
      ok: true,
      data: { status: "cancelled" },
    });

    expect(mocks.cancelDispatchJob).toHaveBeenCalledWith("job-1");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: "cancelled" }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/track");
  });
});
