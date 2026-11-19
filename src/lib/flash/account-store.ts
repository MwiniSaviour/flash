import type { SavedPlace } from "./types";

/**
 * Process-local account state for keyless runs.
 *
 * When Postgres is connected nothing here is used. Without it, these stores
 * let the account screens keep working across server actions and page renders
 * instead of losing every change between bundles.
 */
type AccountStore = {
  profile: { name: string; email: string; notificationsEnabled: boolean } | null;
  savedPlaces: SavedPlace[] | null;
  readKeys: Set<string>;
};

const host = globalThis as typeof globalThis & { __flashAccountStore?: AccountStore };

export const accountStore: AccountStore =
  host.__flashAccountStore ??
  (host.__flashAccountStore = {
    profile: null,
    savedPlaces: null,
    readKeys: new Set<string>(),
  });
