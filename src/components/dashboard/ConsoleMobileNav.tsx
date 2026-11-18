"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Icon, type IconName } from "@/components/flash/Icon";
import { Sheet } from "@/components/flash/Sheet";
import { CONSOLE_LABEL, CONSOLE_SECTIONS, type ConsoleKind } from "@/lib/flash/console";
import type { Business } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

import { BusinessSwitcher } from "./BusinessSwitcher";
import { useConsoleScrollSpy } from "./useConsoleScrollSpy";

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
 * The hamburger lives in the page header, which stays server-rendered. The
 * drawer reads the same section map and the same scroll-spy hook as the
 * desktop sidebar, so the two navigations never disagree about what exists.
 */
export function ConsoleMobileNav({
  kind,
  businesses,
  currentId,
}: {
  kind: ConsoleKind;
  businesses: Business[];
  currentId: string;
}) {
  const [open, setOpen] = useState(false);
  const pendingSection = useRef<string | null>(null);
  const active = useConsoleScrollSpy(kind);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (open) return;

    const target = pendingSection.current;
    if (!target) return;
    pendingSection.current = null;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";

    if (target === "top") {
      window.scrollTo({ top: 0, behavior });
    } else {
      document.getElementById(target)?.scrollIntoView({ behavior, block: "start" });
    }
  }, [open]);

  const goToSection = (id: string) => {
    pendingSection.current = id;
    setOpen(false);
  };

  const sections = CONSOLE_SECTIONS[kind];

  return (
    <>
      <button
        type="button"
        aria-label="Open console menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition active:scale-95 lg:hidden"
      >
        <Icon name="menu" size={20} />
      </button>

      {open ? (
        <Sheet title={CONSOLE_LABEL[kind]} onClose={close}>
          <nav aria-label="Console sections" className="pb-2">
            <div className="space-y-0.5">
              <button type="button" onClick={() => goToSection("top")} className={ROW}>
                <RowBody icon="home" label="Overview" active={active === null} />
              </button>
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => goToSection(section.id)}
                  className={ROW}
                >
                  <RowBody
                    icon={section.icon}
                    label={section.label}
                    active={active === section.id}
                  />
                </button>
              ))}
            </div>

            <BusinessSwitcher
              businesses={businesses}
              currentId={currentId}
              onNavigate={close}
              className="mt-3 border-t border-line/80 pt-3"
            />

            <div className="my-2 border-t border-line/80" aria-hidden="true" />

            <div className="space-y-0.5">
              <Link href="/dashboard" onClick={close} className={ROW}>
                <RowBody icon="dashboard" label="Your dashboard" />
              </Link>
              <Link href="/profile" onClick={close} className={ROW}>
                <RowBody icon="user" label="Your account" />
              </Link>
            </div>
          </nav>
        </Sheet>
      ) : null}
    </>
  );
}
