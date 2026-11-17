"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { Icon } from "@/components/flash/Icon";
import { cn } from "@/lib/utils";

/**
 * The booking sheet.
 *
 * A booking is a short, focused task, so it happens in a sheet over the screen
 * the customer came from rather than on a page of its own: nothing behind it
 * is lost, and closing it puts them back where they were. On the phone it
 * rises from the bottom edge, thumb first; from `lg` it becomes a centred
 * dialog over a dimmed page.
 */
export function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/40 motion-safe:animate-fade"
      />

      <div className="absolute inset-x-0 bottom-0 lg:inset-auto lg:left-1/2 lg:top-1/2 lg:w-[560px] lg:-translate-x-1/2 lg:-translate-y-1/2">
        <div
          ref={panelRef}
          tabIndex={-1}
          className={cn(
            "flex max-h-[92dvh] flex-col rounded-t-[20px] bg-surface shadow-raised outline-none motion-safe:animate-sheet",
            "lg:max-h-[86dvh] lg:rounded-[20px]",
          )}
        >
          <div className="shrink-0 px-5 pt-3">
            <span className="mx-auto block h-1 w-9 rounded-full bg-line-strong lg:hidden" aria-hidden="true" />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line/80 px-5 pb-3 pt-3">
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-ink transition active:scale-95"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-4">
            {children}
          </div>

          {footer ? (
            <div className="shrink-0 border-t border-line/80 bg-surface px-5 pt-3 pb-[max(env(safe-area-inset-bottom),0px)]">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
