"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FlashLogo } from "@/components/flash/FlashLogo";
import { Icon } from "@/components/flash/Icon";
import { CONSOLE_SECTIONS, consoleHref, type ConsoleKind } from "@/lib/flash/console";
import type { Business } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

import { BusinessSwitcher } from "./BusinessSwitcher";

const ROW =
  "flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[14px] transition-colors";

/**
 * The desktop console chrome.
 *
 * A layout cannot read the business id out of a page's params in every case,
 * so the owning layout passes it here. Each section is a link to its own
 * route rather than a scroll target. On the phone the shell disappears and the
 * page header plus the bottom nav take over.
 */
export function ConsoleShell({
  kind,
  businessId,
  businesses = [],
  currentId = "",
  children,
}: {
  kind?: ConsoleKind;
  businessId?: string;
  businesses?: Business[];
  currentId?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const sections = kind && businessId ? CONSOLE_SECTIONS[kind] : [];

  const isActive = (path: string) =>
    path ? pathname.startsWith(consoleHref(kind!, businessId!, path)) : pathname === consoleHref(kind!, businessId!);

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="no-print sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col border-r border-line/70 px-4 py-5 lg:flex">
        <Link href="/" className="px-2" aria-label="ScalDive — home">
          <FlashLogo size="sm" />
        </Link>

        <Link
          href="/dashboard/products"
          className={cn(ROW, "mt-4", pathname === "/dashboard/products" && "bg-brand-soft text-brand-ink")}
        >
          <Icon name="store" size={18} />
          My products
        </Link>

        {kind && businessId ? (
          <>
            <BusinessSwitcher businesses={businesses} currentId={currentId} className="mt-6" />

            <nav aria-label="Console sections" className="mt-6 flex flex-col gap-1">
              {sections.map((section) => {
                const active = isActive(section.path);

                return (
                  <Link
                    key={section.path}
                    href={consoleHref(kind, businessId, section.path)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      ROW,
                      active
                        ? "bg-surface font-semibold text-ink shadow-[0_1px_2px_rgb(23_26_31/0.05)]"
                        : "font-medium text-muted hover:bg-surface-2/70 hover:text-ink",
                    )}
                  >
                    <Icon
                      name={section.icon}
                      size={19}
                      className={cn("shrink-0", active ? "text-brand" : "text-icon-idle")}
                    />
                    {section.label}
                  </Link>
                );
              })}
            </nav>
          </>
        ) : null}
      </aside>

      <div className="min-w-0 flex-1">
        <main
          id="main-content"
          className="mx-auto w-full max-w-[880px] px-5 pb-[calc(96px+env(safe-area-inset-bottom,0px))] pt-4 lg:px-8 lg:pb-16 lg:pt-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
