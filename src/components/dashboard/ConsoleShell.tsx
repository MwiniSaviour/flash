"use client";

import Link from "next/link";

import { FlashLogo } from "@/components/flash/FlashLogo";
import { Icon } from "@/components/flash/Icon";
import { CONSOLE_SECTIONS, type ConsoleKind } from "@/lib/flash/console";
import type { Business } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

import { BusinessSwitcher } from "./BusinessSwitcher";
import { useConsoleScrollSpy } from "./useConsoleScrollSpy";

const ROW =
  "flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[14px] transition-colors";

/**
 * The desktop console chrome.
 *
 * A layout cannot read the business id out of a child route's params, so each
 * console page wraps its own server-rendered content in this shell. The shell
 * is the only client piece: everything inside it stays on the server. On the
 * phone it disappears and the page's own header plus the bottom nav take over.
 */
export function ConsoleShell({
  kind,
  businesses = [],
  currentId = "",
  children,
}: {
  kind?: ConsoleKind;
  businesses?: Business[];
  currentId?: string;
  children: React.ReactNode;
}) {
  const active = useConsoleScrollSpy(kind ?? "restaurant");
  const sections = kind ? CONSOLE_SECTIONS[kind] : [];

  const goToSection = (id: string) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";

    if (id === "top") window.scrollTo({ top: 0, behavior });
    else document.getElementById(id)?.scrollIntoView({ behavior, block: "start" });
  };

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="no-print sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col border-r border-line/70 px-4 py-5 lg:flex">
        <Link href="/" className="px-2" aria-label="Flash — home">
          <FlashLogo size="sm" />
        </Link>

        {kind ? (
          <>
            <BusinessSwitcher businesses={businesses} currentId={currentId} className="mt-6" />

            <nav aria-label="Console sections" className="mt-6 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => goToSection("top")}
                aria-current={active === null ? "true" : undefined}
                className={cn(
                  ROW,
                  active === null
                    ? "bg-surface font-semibold text-ink shadow-[0_1px_2px_rgb(23_26_31/0.05)]"
                    : "font-medium text-muted hover:bg-surface-2/70 hover:text-ink",
                )}
              >
                <Icon name="home" size={19} className="shrink-0 text-icon-idle" />
                Overview
              </button>

              {sections.map((section) => {
                const current = active === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => goToSection(section.id)}
                    aria-current={current ? "true" : undefined}
                    className={cn(
                      ROW,
                      current
                        ? "bg-surface font-semibold text-ink shadow-[0_1px_2px_rgb(23_26_31/0.05)]"
                        : "font-medium text-muted hover:bg-surface-2/70 hover:text-ink",
                    )}
                  >
                    <Icon name={section.icon} size={19} className="shrink-0 text-icon-idle" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </>
        ) : null}

        <div className="mt-auto space-y-1 border-t border-line/70 pt-4">
          <Link
            href="/dashboard"
            aria-current={!kind ? "page" : undefined}
            className={cn(
              ROW,
              !kind
                ? "bg-surface font-semibold text-ink shadow-[0_1px_2px_rgb(23_26_31/0.05)]"
                : "font-medium text-muted hover:bg-surface-2/70 hover:text-ink",
            )}
          >
            <Icon name="dashboard" size={19} className="shrink-0 text-icon-idle" />
            Your dashboard
          </Link>
          <Link
            href="/profile"
            className={cn(ROW, "font-medium text-muted hover:bg-surface-2/70 hover:text-ink")}
          >
            <Icon name="user" size={19} className="shrink-0 text-icon-idle" />
            Your account
          </Link>
        </div>
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
