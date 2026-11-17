"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/flash/Icon";
import { mobileTabs, isActivePath } from "@/lib/flash/navigation";
import { cn } from "@/lib/utils";

/**
 * The phone's bottom tab bar.
 *
 * Five destinations with the ride button raised out of the middle — the action
 * the app exists for gets the physical centre of the bar, and every other
 * destination steps back around it. There is no profile destination: the
 * account lives behind the avatar in the header and at the foot of the rail.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-paper/95 pb-[max(env(safe-area-inset-bottom),0px)] backdrop-blur-xl lg:hidden"
    >
      <ul className="relative mx-auto grid h-[78px] max-w-[520px] grid-cols-5 items-end px-1.5 pt-3 pb-2">
        {mobileTabs.map((tab) => {
          const active = isActivePath(pathname, tab.href);

          if (tab.raised) {
            return (
              <li key={tab.href} className="relative flex h-full flex-col items-center justify-end">
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  aria-label="Book a ride"
                  className="absolute -top-[16px] grid h-[54px] w-[54px] place-items-center rounded-full bg-brand-solid text-white shadow-brand-lift ring-[5px] ring-paper transition active:scale-95"
                >
                  <Icon name={tab.icon} size={24} filled={active} />
                </Link>
                <span
                  className={cn(
                    "text-[10.5px] leading-none tracking-[0.01em] transition-colors",
                    active ? "font-semibold text-brand" : "font-medium text-muted",
                  )}
                >
                  {tab.label}
                </span>
              </li>
            );
          }

          return (
            <li key={tab.href} className="flex h-full flex-col items-center justify-end pb-0.5">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="group flex flex-col items-center gap-[5px] rounded-xl px-1 py-1 transition active:scale-[0.96]"
              >
                <Icon
                  name={tab.icon}
                  size={21}
                  filled={active}
                  className={cn(
                    "transition-colors",
                    active ? "text-brand" : "text-icon-idle group-active:text-ink",
                  )}
                />
                <span
                  className={cn(
                    "text-[10.5px] leading-none tracking-[0.01em] transition-colors",
                    active ? "font-semibold text-brand" : "font-medium text-muted",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
