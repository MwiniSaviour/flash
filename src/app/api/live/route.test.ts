import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  userId: null as string | null,
  digests: [] as string[],
}));

vi.mock("@/lib/auth/server", () => ({
  currentUserId: async () => state.userId,
}));
vi.mock("@/lib/live/stream", () => ({
  buildLiveDigest: async () => state.digests.shift() ?? "stable",
}));

import { GET } from "./route";

describe("live stream route", () => {
  beforeEach(() => {
    state.userId = null;
    state.digests = [];
  });

  it("rejects unauthenticated requests", async () => {
    const response = await GET(new Request("http://localhost/api/live"));
    expect(response.status).toBe(401);
  });

  it("streams only a coarse connected signal for a signed-in user", async () => {
    state.userId = "user-1";
    state.digests = ["first", "second"];

    const controller = new AbortController();
    const response = await GET(
      new Request("http://localhost/api/live", { signal: controller.signal }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-accel-buffering")).toBe("no");

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    const chunk = await reader!.read();
    expect(new TextDecoder().decode(chunk.value)).toBe(": connected\n\n");

    controller.abort();
    await reader!.cancel();
  });
});
