import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The sticky action bar.
 *
 * On the phone it floats above the bottom tab bar — a booking action must never
 * sit behind the navigation. On the desktop it becomes a sticky footer inside
 * the content column, which keeps the same button reachable without a second
 * copy of the markup.
 */
export function StickyAction({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(94px+env(safe-area-inset-bottom,0px))] z-30 border-t border-line/80 bg-paper/95 px-5 py-3 backdrop-blur-xl",
        "lg:sticky lg:bottom-6 lg:mt-6 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-[680px] items-center gap-3">{children}</div>
    </div>
  );
}
