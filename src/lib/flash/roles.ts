/** The two Flash account roles, stored in Clerk public metadata as `role`. */
export const USER_ROLES = ["admin", "customer"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Human labels, also the names to use when assigning roles in Clerk Dashboard. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  customer: "Customer",
};

export const DEFAULT_ROLE: UserRole = "customer";

/** Read a role from Clerk metadata, defaulting everyone else to customer. */
export function roleOf(value: unknown): UserRole {
  return value === "admin" ? "admin" : DEFAULT_ROLE;
}
