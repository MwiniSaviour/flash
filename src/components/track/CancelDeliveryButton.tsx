"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useToast } from "@/components/flash/ToastProvider";
import { cancelDeliveryAction } from "@/lib/flash/actions";

/**
 * A two-step cancel control. The first tap asks for confirmation; the second
 * calls the server action, which asks the dispatch engine to release the job
 * before Flash marks the local booking cancelled.
 */
export function CancelDeliveryButton({
  id,
  kind,
  label,
}: {
  id: string;
  kind: "ride" | "parcel";
  label: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const cancel = () => {
    startTransition(async () => {
      const result = await cancelDeliveryAction({ id, kind });
      if (!result.ok) {
        toast(result.error);
        setConfirming(false);
        return;
      }
      router.refresh();
    });
  };

  if (confirming) {
    return (
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={cancel}
          className="h-[44px] flex-1 rounded-[12px] bg-danger text-[13.5px] font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "Cancelling…" : `Confirm ${label.toLowerCase()}`}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="h-[44px] flex-1 rounded-[12px] border border-line bg-surface text-[13.5px] font-semibold text-ink transition active:scale-[0.99] disabled:opacity-60"
        >
          Keep it
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="mt-2 h-[44px] w-full rounded-[12px] border border-line bg-surface text-[13.5px] font-semibold text-danger transition active:scale-[0.99]"
    >
      {label}
    </button>
  );
}
