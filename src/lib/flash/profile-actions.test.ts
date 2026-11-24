import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/auth/server", () => ({ currentUserId: async () => "usr-1" }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => null }));
vi.mock("@/lib/flash/profile", () => ({ ensureProfile: async () => {} }));
vi.mock("@/lib/notifications/inbox", () => ({ markPersistedRead: async () => {} }));

import {
  addSavedPlace,
  deleteSavedPlace,
  markNotificationsRead,
  setNotificationsEnabled,
  updateProfile,
  updateSavedPlace,
} from "./profile-actions";

const writes: [string, () => Promise<unknown>][] = [
  ["updateProfile", () => updateProfile({ name: "Ada" })],
  ["setNotificationsEnabled", () => setNotificationsEnabled(true)],
  ["addSavedPlace", () => addSavedPlace({ label: "Home", detail: "Osu" })],
  [
    "updateSavedPlace",
    () => updateSavedPlace({ id: "pl-1", label: "Home", detail: "Osu" }),
  ],
  ["deleteSavedPlace", () => deleteSavedPlace("pl-1")],
  ["markNotificationsRead", () => markNotificationsRead(["ticket:1", "ntf:1"])],
];

describe("profile writes without a database", () => {
  it.each(writes)("%s fails closed instead of claiming success", async (_name, write) => {
    await expect(write()).rejects.toThrow("Database is not configured");
  });
});
