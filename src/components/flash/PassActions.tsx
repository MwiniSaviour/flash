"use client";

import { useState } from "react";

import { Icon } from "@/components/flash/Icon";

/**
 * The actions on a proof of booking.
 *
 * Share uses the platform's own share sheet where the browser has one, and
 * falls back to copying the reference — the two things a customer needs at a
 * gate or with a rider. Print opens the browser's print dialog, which is how a
 * pass becomes something you can keep on paper.
 */
export function PassActions({
  reference,
  title,
  shareLabel = "Share",
  printLabel = "Print",
}: {
  reference: string;
  title: string;
  shareLabel?: string;
  printLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = typeof window === "undefined" ? "" : window.location.href;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: `${title} — ${reference}`, url });
        return;
      } catch {
        // The customer dismissed the sheet; fall through to copying.
      }
    }

    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked; the reference is on screen anyway.
    }
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={share}
        className="flex h-[44px] flex-1 items-center justify-center gap-2 rounded-[12px] border border-line bg-surface text-[13.5px] font-semibold text-ink transition hover:border-line-strong active:scale-[0.99]"
      >
        <Icon name={copied ? "check" : "share"} size={16} />
        {copied ? "Reference copied" : shareLabel}
      </button>

      <button
        type="button"
        onClick={() => window.print()}
        className="flex h-[44px] flex-1 items-center justify-center gap-2 rounded-[12px] border border-line bg-surface text-[13.5px] font-semibold text-ink transition hover:border-line-strong active:scale-[0.99]"
      >
        <Icon name="receipt" size={16} />
        {printLabel}
      </button>
    </div>
  );
}
