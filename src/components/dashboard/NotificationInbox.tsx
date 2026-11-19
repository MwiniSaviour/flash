"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { markNotificationsRead, setNotificationsEnabled } from "@/lib/flash/profile-actions";
import type { AppNotification } from "@/lib/flash/notifications";

export function NotificationInbox({ items }: { items: AppNotification[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function mark(keys: string[]) {
    setError(null);
    start(async () => {
      const result = await markNotificationsRead(keys);
      if (!result.ok) {
        setError(result.error ?? "The alerts could not be updated.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-5 px-5">
      {error ? (
        <p role="alert" className="mb-3 text-[12.5px] text-danger-ink">
          {error}
        </p>
      ) : null}

      {items.length ? (
        <>
          <button
            type="button"
            disabled={pending || !items.some((item) => !item.read)}
            onClick={() => mark(items.filter((item) => !item.read).map((item) => item.key))}
            className="mb-3 h-9 rounded-[10px] border border-line bg-surface px-3 text-[12.5px] font-semibold text-ink disabled:opacity-50"
          >
            Mark all as read
          </button>
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.key}
                className={`rounded-[14px] border bg-surface p-3.5 ${
                  item.read ? "border-line/80" : "border-brand/35"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-surface-2 text-icon-idle">
                    <Icon name="bell" size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted">{item.detail}</p>
                    <p className="mt-1 text-[11px] text-muted-soft">
                      {item.at.slice(0, 16).replace("T", " ")}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1 text-[12.5px] font-bold text-brand-ink"
                      >
                        View
                        <Icon name="chevron-right" size={12} />
                      </Link>
                      {!item.read ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => mark([item.key])}
                          className="text-[12.5px] font-semibold text-muted"
                        >
                          Mark as read
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="rounded-[14px] border border-dashed border-line-strong/70 bg-surface/60 p-6 text-center text-[13px] text-muted">
          Nothing needs your attention.
        </p>
      )}
    </div>
  );
}

export function NotificationPreference({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    start(async () => {
      const result = await setNotificationsEnabled(next);
      if (!result.ok) setOn(!next);
      router.refresh();
    });
  }

  return (
    <div className="mt-3 rounded-[14px] border border-line/90 bg-surface p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-ink">Show alerts</p>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Notify me when a ticket, order or application changes.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={pending}
          onClick={toggle}
          className={`relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors ${
            on ? "bg-brand-solid" : "bg-line-strong"
          }`}
        >
          <span
            className={`absolute top-[3px] h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)] transition-all ${
              on ? "left-[23px]" : "left-[3px]"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
