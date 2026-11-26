/** ScalDive account roles, stored in Clerk public metadata as `role`. */
export const USER_ROLES = ["admin", "business_owner", "customer"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Human labels, also the names to use when assigning roles in Clerk Dashboard. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  business_owner: "Business owner",
  customer: "Customer",
};

export const DEFAULT_ROLE: UserRole = "customer";

/** Read a role from Clerk metadata, defaulting everyone else to customer. */
export function roleOf(value: unknown): UserRole {
  return value === "admin" || value === "business_owner" ? value : DEFAULT_ROLE;
}

/** Who may open the business console. Platform admins may inspect it too. */
export function canManageBusiness(role: UserRole): boolean {
  return role === "business_owner" || role === "admin";
}
