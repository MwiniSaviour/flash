import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    dispatchBaseUrl: "https://engine.test/",
    dispatchApiKey: "flash-key",
    dispatchAppId: "flash",
  }),
}));

import { cancelDispatchJob } from "./client";

describe("dispatch client", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ jobId: "job-1", status: "cancelled" }),
      })),
    );
  });

  it("posts the scoped cancel path with the service key", async () => {
    const result = await cancelDispatchJob("job-1");
    expect(result.status).toBe("cancelled");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://engine.test/v1/jobs/job-1/cancel");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["x-dispatch-key"]).toBe("flash-key");
    expect((init?.headers as Record<string, string>)["x-app-id"]).toBe("flash");
  });
});
