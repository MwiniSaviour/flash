import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ hasAdminEnv: false }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/server", () => ({ currentUserId: async () => "usr-1" }));
vi.mock("@/lib/env", () => ({ hasDatabaseAdminEnv: () => mocks.hasAdminEnv }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => null }));
vi.mock("./copy", () => ({ notificationHref: () => "/profile/notifications" }));

import {
  getBusinessNotifications,
  getBusinessUnreadCount,
  getPersistedNotifications,
  listNotificationIds,
  markPersistedRead,
} from "./inbox";

const dbPaths: [string, () => Promise<unknown>][] = [
  ["getBusinessNotifications", () => getBusinessNotifications()],
  ["listNotificationIds", () => listNotificationIds()],
  ["getBusinessUnreadCount", () => getBusinessUnreadCount()],
  ["markPersistedRead", () => markPersistedRead(["ntf-1"])],
];

describe("notification inbox", () => {
  it.each(dbPaths)("%s fails closed without a database", async (_name, read) => {
    await expect(read()).rejects.toThrow("Database is not configured");
  });

  it("returns an honestly empty storefront inbox in demo mode", async () => {
    await expect(getPersistedNotifications()).resolves.toEqual([]);
  });

  it("does not serve an empty storefront inbox when a database is expected", async () => {
    mocks.hasAdminEnv = true;
    await expect(getPersistedNotifications()).rejects.toThrow("Database is not configured");
    mocks.hasAdminEnv = false;
  });
});
