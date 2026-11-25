"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Icon } from "@/components/flash/Icon";
import { describeError } from "@/lib/flash/error-copy";

type Notify = (message: string, field?: string) => void;

const ToastContext = createContext<Notify | null>(null);

/** Show a short error and, when the message names one, focus the bad field. */
export function useToast(): Notify {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used inside ToastProvider");
  return notify;
}

/**
 * One error at a time, above the page and out of the form. The message is
 * short, carries an icon as well as words, and the field it names is scrolled
 * into view and focused so the next action is obvious.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; field?: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const notify = useCallback<Notify>((message, field) => {
    const copy = describeError(message);
    const id = ++counter.current;
    setToast({ id, message: copy.message, field: copy.field ?? field });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 5500);
  }, []);

  useEffect(() => {
    if (!toast?.field) return;
    const frame = requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`[data-field="${CSS.escape(toast.field!)}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [toast]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-[max(env(safe-area-inset-top),12px)]">
          <div
            key={toast.id}
            role="alert"
            className="animate-rise pointer-events-auto flex w-full max-w-[420px] items-start gap-2.5 rounded-[12px] border border-danger/30 bg-surface px-3.5 py-2.5 shadow-raised"
          >
            <Icon name="info" size={17} className="mt-px shrink-0 text-danger" />
            <p className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug text-ink">
              {toast.message}
            </p>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => {
                if (timer.current) clearTimeout(timer.current);
                setToast(null);
              }}
              className="-mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted transition active:bg-surface-2"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
