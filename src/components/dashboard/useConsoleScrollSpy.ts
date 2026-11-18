"use client";

import { useEffect, useState } from "react";

import { CONSOLE_SECTIONS, type ConsoleKind } from "@/lib/flash/console";

/**
 * Which console section is currently on screen.
 *
 * The sidebar and the mobile drawer share this so both highlight the same
 * place. IntersectionObserver keeps it honest while the manager scrolls;
 * there is no scroll handler to fight the browser's own momentum.
 */
export function useConsoleScrollSpy(kind: ConsoleKind): string | null {
  const [active, setActive] = useState<string | null>(CONSOLE_SECTIONS[kind][0]?.id ?? null);

  useEffect(() => {
    const ids = CONSOLE_SECTIONS[kind].map((section) => section.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!elements.length || typeof IntersectionObserver === "undefined") return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
          else visible.delete(entry.target.id);
        }

        if (visible.size) {
          const [top] = [...visible.entries()].sort((a, b) => b[1] - a[1]);
          setActive(top[0]);
        }
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [kind]);

  return active;
}
