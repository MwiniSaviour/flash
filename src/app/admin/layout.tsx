import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const identity = await requireAdmin();
  if (!identity) notFound();

  return <AdminShell identity={identity}>{children}</AdminShell>;
}
