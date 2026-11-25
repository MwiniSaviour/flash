import type { UserRole } from "./roles";

/** The one ownership gate for seller-managed products. */
export function assertSellerOwns(
  ownerUserId: string | null | undefined,
  currentUserId: string | null,
  role: UserRole,
): void {
  if (role !== "business_owner" && role !== "admin") {
    throw new Error("Not your product");
  }
  if (role === "admin") return;
  if (!ownerUserId || !currentUserId || ownerUserId !== currentUserId) {
    throw new Error("Not your product");
  }
}
