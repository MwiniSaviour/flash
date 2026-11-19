"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setNotificationsEnabled } from "@/lib/flash/profile-actions";

/** The account's real notification switch — it persists with the profile. */
export function NotificationsSetting({ enabled }: { enabled: boolean }) {
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
    <div className="flex items-start justify-between gap-3 border-t border-line/70 pt-3">
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-ink">Show alerts</span>
        <span className="mt-0.5 block text-[12.5px] text-muted">
          Door-open and confirmation alerts.
        </span>
      </span>
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
  );
}
