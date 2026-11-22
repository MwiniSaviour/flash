import { notFound } from "next/navigation";

import { BottomNav } from "@/components/flash/BottomNav";
import { currentRole } from "@/lib/auth/server";
import { getEnv } from "@/lib/env";
import { canManageBusiness } from "@/lib/flash/roles";

/**
 * The console shell.
 *
 * Business screens leave the social app's rails and top bar behind. On the
 * phone they keep the same bottom tab bar as everywhere else; from `lg` the
 * page supplies its own sidebar. Nothing here can be prerendered — a ticket
 * confirmed at 10:00 must show as confirmed at 10:01.
 */
export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  // The business console is for the Business owner role. Keyless demo mode has
  // no Clerk roles, so it keeps working; a connected deployment does not let a
  // plain customer into a console by guessing a business id.
  if (getEnv().clerkPublishableKey && !canManageBusiness(await currentRole())) notFound();

  return (
    <div className="min-h-dvh">
      {children}
      <BottomNav />
    </div>
  );
}
