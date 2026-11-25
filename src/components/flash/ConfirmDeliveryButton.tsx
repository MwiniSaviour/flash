"use client";

import { useState, useTransition } from "react";

import { SignInGate } from "@/components/auth/SignInGate";
import { Icon } from "@/components/flash/Icon";
import { useToast } from "@/components/flash/ToastProvider";
import { confirmDeliveryAction } from "@/lib/flash/actions";

/**
 * The customer's confirmation.
 *
 * The driver is only paid after the customer says the order arrived, so this
 * button is the release gate for the held delivery fee and the seller's net.
 */
export function ConfirmDeliveryButton({ orderId }: { orderId: string }) {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const notify = useToast();

  if (done) {
    return (
      <p className="mt-3 flex items-center gap-1.5 rounded-[12px] bg-success-soft px-3 py-2.5 text-[13px] font-semibold text-success-ink">
        <Icon name="check" size={15} />
        Delivery confirmed — the rider has been paid.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <SignInGate
        label="Sign in to confirm delivery"
        className="flex h-11 w-full items-center justify-center rounded-[12px] bg-brand-solid text-[14px] font-bold text-white transition hover:bg-brand-solid-hover"
      >
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await confirmDeliveryAction({ orderId });
              if (!result.ok) {
                notify(result.error);
                return;
              }
              setDone(true);
            })
          }
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[14px] font-bold text-white transition hover:bg-brand-solid-hover disabled:opacity-60"
        >
          <Icon name="check" size={16} />
          {isPending ? "Confirming." : "I have received my order"}
        </button>
      </SignInGate>
    </div>
  );
}
