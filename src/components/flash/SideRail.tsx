"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FlashLogo } from "@/components/flash/FlashLogo";
import { Icon } from "@/components/flash/Icon";
import { Avatar } from "@/components/flash/ui";
import { isActivePath, navItems } from "@/lib/flash/navigation";
import type { FlashUser } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

/**
 * The desktop navigation rail.
 *
 * The social-app idiom the product asked for: a persistent left rail that
 * holds the brand, the destinations and the account at the bottom, so the
 * centre column can stay a single readable stream.
 */
export function SideRail({ user }: { user: FlashUser }) {
  const pathname = usePathname();

  return (
    <aside className="no-print sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line/70 px-4 py-5 lg:flex">
      <Link href="/" className="px-2" aria-label="Flash — home">
        <FlashLogo />
      </Link>

      <nav aria-label="Primary" className="mt-8 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-11 items-center gap-3 rounded-[12px] px-3 text-[14px] transition-colors",
                active
                  ? "bg-surface font-semibold text-ink shadow-[0_1px_2px_rgb(23_26_31/0.05)]"
                  : "font-medium text-muted hover:bg-surface-2/70 hover:text-ink",
              )}
            >
              <Icon
                name={item.icon}
                size={20}
                filled={active}
                className={cn(
                  "shrink-0 transition-colors",
                  active ? "text-brand" : "text-icon-idle group-hover:text-ink",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-line/70 pt-4">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors hover:bg-surface-2/70"
        >
          <Avatar src={user.avatarUrl} alt={`${user.name}'s profile photo`} name={user.name} size={38} />
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold text-ink">{user.name}</span>
            <span className="block truncate text-[12px] text-muted">View profile</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
