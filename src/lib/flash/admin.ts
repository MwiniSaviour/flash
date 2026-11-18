import { requireAdmin } from "@/lib/admin/auth";

/** Whether the signed-in Clerk user may see the admin surface. */
export async function isAdmin(): Promise<boolean> {
  return Boolean(await requireAdmin());
}
