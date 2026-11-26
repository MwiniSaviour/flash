"use client";

import { useEffect } from "react";

import { Icon } from "@/components/flash/Icon";

/**
 * The failure state.
 *
 * A screen that cannot reach the database says so plainly and offers a way
 * back, instead of showing an empty list that looks like an empty account.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-5 pt-8">
      <div className="rounded-[20px] border border-line/90 bg-surface p-5 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-danger-soft text-danger">
          <Icon name="info" size={28} />
        </span>
        <h1 className="mt-4 text-[20px] font-bold tracking-[-0.02em] text-ink">
          We could not load this
        </h1>
        <p className="mx-auto mt-1.5 max-w-[34ch] text-[13.5px] leading-relaxed text-muted">
          The connection to ScalDive failed. Nothing you booked was lost — try again in a moment.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-5 flex h-[48px] w-full items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover active:bg-brand-solid-pressed"
        >
          Try again
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </div>
  );
}
