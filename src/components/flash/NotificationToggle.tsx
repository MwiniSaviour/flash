"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/** A simple on/off switch for notification preferences. */
export function NotificationToggle({ defaultOn = true }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Event and order notifications"
      onClick={() => setOn((value) => !value)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        on ? "bg-brand-solid" : "bg-line-strong",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all",
          on ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}
