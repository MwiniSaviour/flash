import Link from "next/link";

import { Avatar } from "@/components/flash/ui";
import { getCurrentUser } from "@/lib/flash/repository";
import type { ConsoleKind } from "@/lib/flash/console";
import type { Business } from "@/lib/flash/types";

import { ConsoleMobileNav } from "./ConsoleMobileNav";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * The console's top bar.
 *
 * The shop and the person working on it live here. The hamburger is part of
 * this sticky bar, so it never scrolls out of view. The account control moved
 * up from the sidebar.
 */
export async function ConsoleTopbar({
  name,
  kind,
  businessId,
  businesses = [],
  currentId,
}: {
  name: string;
  kind?: ConsoleKind;
  businessId?: string;
  businesses?: Business[];
  currentId?: string;
}) {
  const user = await getCurrentUser();
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

  return (
    <header className="no-print sticky top-0 z-30 -mx-5 flex items-center justify-between gap-3 border-b border-line/70 bg-paper/95 px-5 py-3 backdrop-blur-xl lg:-mx-8 lg:px-8">
      <div className="min-w-0">
        <p className="truncate text-[17px] font-bold leading-tight tracking-[-0.02em] text-ink">
          {name}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-muted">
          {greeting()}, {firstName}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {kind && businessId ? (
          <ConsoleMobileNav
            kind={kind}
            businessId={businessId}
            businesses={businesses}
            currentId={currentId ?? businessId}
          />
        ) : null}

        <Link
          href="/profile"
          aria-label="Your account"
          className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-2"
        >
          <Avatar
            src={user.avatarUrl}
            alt={`${user.name}'s profile photo`}
            name={user.name}
            size={36}
          />
          <span className="hidden text-[13px] font-semibold text-ink sm:block">Account</span>
        </Link>
      </div>
    </header>
  );
}
