"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { payCommission } from "@/lib/flash/business-actions";
import { cedis } from "@/lib/flash/format";

/** Outstanding commission with a Paystack link to settle it. */
export function CommissionDue({
  businessId,
  charges,
}: {
  businessId: string;
  charges: { id: string; amountPesewas: number; label: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = charges.reduce((sum, charge) => sum + charge.amountPesewas, 0);

  function pay(chargeId: string) {
    setError(null);
    setPendingId(chargeId);
    startTransition(async () => {
      const result = await payCommission({ paymentId: chargeId, businessId });
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.data.checkoutUrl) window.location.href = result.data.checkoutUrl;
    });
  }

  if (charges.length === 0) return null;

  return (
    <section className="mt-5 rounded-[16px] border border-line/90 bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-ink">Commission due</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            Free-event attendee fees for confirmed guests
          </p>
        </div>
        <p className="text-[20px] font-bold tracking-[-0.02em] text-ink">
          {cedis(Math.round(total / 100))}
        </p>
      </div>

      <ul className="mt-3 space-y-2 border-t border-line/70 pt-3">
        {charges.map((charge) => (
          <li key={charge.id} className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-[12.5px] text-muted">{charge.label}</span>
            <button
              type="button"
              onClick={() => pay(charge.id)}
              disabled={isPending}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-brand-solid px-3 text-[12.5px] font-bold text-white disabled:opacity-60"
            >
              <Icon name="arrow-right" size={14} />
              {pendingId === charge.id ? "Opening…" : "Pay commission"}
            </button>
          </li>
        ))}
      </ul>

      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-danger-ink">
          {error}
        </p>
      ) : null}
    </section>
  );
}
