import Link from "next/link";

import { ProfileControl } from "@/components/auth/ProfileControl";
import { Icon } from "@/components/flash/Icon";
import { getCurrentUser } from "@/lib/flash/repository";
import { getBusinessUnreadCount } from "@/lib/notifications/inbox";
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
  const [user, unread] = await Promise.all([getCurrentUser(), getBusinessUnreadCount()]);
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
        <Link
          href="/dashboard/notifications"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-icon-idle"
        >
          <Icon name="bell" size={18} />
          {unread ? (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-solid px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Link>
        {kind && businessId ? (
          <ConsoleMobileNav
            kind={kind}
            businessId={businessId}
            businesses={businesses}
            currentId={currentId ?? businessId}
          />
        ) : null}

        <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2">
          <ProfileControl user={user} size={36} />
          <span className="hidden text-[13px] font-semibold text-ink sm:block">Account</span>
        </div>
      </div>
    </header>
  );
}
