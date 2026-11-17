"use client";

import { useState } from "react";

import { Icon } from "@/components/flash/Icon";

/**
 * The notification switch.
 *
 * A real switch, with the state on the control itself — the reference's
 * account screen had one and it still earns its place: turning on alerts is
 * how a customer hears that doors have opened.
 */
export function NotificationToggle({ defaultOn }: { defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn((value) => !value)}
      className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors ${
        on ? "bg-brand-solid" : "bg-line-strong"
      }`}
    >
      <span
        className={`absolute top-[3px] h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)] transition-all ${
          on ? "left-[23px]" : "left-[3px]"
        }`}
      />
      <span className="sr-only">Turn on notifications</span>
    </button>
  );
}

/**
 * The account's list rows. One component for every entry so the spacing,
 * the icon weight and the chevron stay identical down the list.
 */
export function AccountRow({
  icon,
  label,
  badge,
  href,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  badge?: number;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 border-b border-line/70 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2/40"
    >
      <Icon name={icon} size={19} className="shrink-0 text-icon-idle" />
      <span className="text-[14.5px] font-medium text-ink">{label}</span>
      {badge ? (
        <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">
          {badge}
        </span>
      ) : null}
      <Icon name="chevron-right" size={17} className="ml-auto shrink-0 text-muted-soft" />
    </a>
  );
}
