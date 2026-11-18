"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Icon, type IconName } from "@/components/flash/Icon";
import { Sheet } from "@/components/flash/Sheet";
import {
  CONSOLE_LABEL,
  CONSOLE_SECTIONS,
  consoleHref,
  type ConsoleKind,
} from "@/lib/flash/console";
import type { Business } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

import { BusinessSwitcher } from "./BusinessSwitcher";

const ROW =
  "flex w-full items-center gap-3 rounded-[13px] px-2.5 py-2.5 text-left transition-colors hover:bg-surface-2/60 active:bg-surface-2";

function RowBody({
  icon,
  label,
  active,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
}) {
  return (
    <>
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-[11px]",
          active ? "bg-brand-soft text-brand-ink" : "bg-surface-2 text-icon-idle",
        )}
      >
        <Icon name={icon} size={18} />
      </span>
      <span className="min-w-0 flex-1 text-[14.5px] font-semibold text-ink">{label}</span>
      <Icon name="chevron-right" size={15} className="shrink-0 text-muted-soft" />
    </>
  );
}

/**
 * The phone's console drawer.
 *
 * The hamburger lives in the sticky top bar, so it stays in view while the
 * manager scrolls. Every item is a link to a real route — the same sections
 * the desktop sidebar shows, in the same order.
 */
export function ConsoleMobileNav({
  kind,
  businessId,
  businesses,
  currentId,
}: {
  kind: ConsoleKind;
  businessId: string;
  businesses: Business[];
  currentId: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  const isActive = (path: string) =>
    path
      ? pathname.startsWith(consoleHref(kind, businessId, path))
      : pathname === consoleHref(kind, businessId);

  return (
    <>
      <button
        type="button"
        aria-label="Open console menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink transition active:scale-95 lg:hidden"
      >
        <Icon name="menu" size={19} />
      </button>

      {open ? (
        <Sheet title={CONSOLE_LABEL[kind]} onClose={close}>
          <nav aria-label="Console sections" className="pb-2">
            <div className="space-y-0.5">
              {CONSOLE_SECTIONS[kind].map((section) => (
                <Link
                  key={section.path}
                  href={consoleHref(kind, businessId, section.path)}
                  onClick={close}
                  aria-current={isActive(section.path) ? "page" : undefined}
                  className={ROW}
                >
                  <RowBody
                    icon={section.icon}
                    label={section.label}
                    active={isActive(section.path)}
                  />
                </Link>
              ))}
            </div>

            <BusinessSwitcher
              businesses={businesses}
              currentId={currentId}
              onNavigate={close}
              className="mt-3 border-t border-line/80 pt-3"
            />
          </nav>
        </Sheet>
      ) : null}
    </>
  );
}
