"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { SignInGate } from "@/components/auth/SignInGate";
import { Icon } from "@/components/flash/Icon";
import { PaymentMethods, PaymentNote, type PaymentMethodId } from "@/components/flash/PaymentMethods";
import { useToast } from "@/components/flash/ToastProvider";
import { useCart } from "@/lib/cart";
import { bookTicketBatch } from "@/lib/flash/actions";
import { payWithIntent } from "@/lib/payments/inline";
import { cedis } from "@/lib/flash/format";

/** The ticket basket: every chosen tier, with its own quantity. */
export function EventsCheckout() {
  const cart = useCart();
  const [method, setMethod] = useState<PaymentMethodId>("momo");
  const [done, setDone] = useState<string[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const notify = useToast();

  const lines = cart.lines.filter((line) => line.kind === "ticket" && line.tierId);
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  function checkout() {
    startTransition(async () => {
      const result = await bookTicketBatch({
        lines: lines.map((line) => ({ tierId: line.tierId!, quantity: line.quantity })),
        paymentMethod: method === "cash" ? "cash" : "online",
      });

      if (!result.ok) {
        notify(result.error);
        return;
      }

      const complete = () => {
        setDone(result.data.references);
        cart.clear();
      };

      if (result.data.checkout) {
        await payWithIntent(result.data.checkout, complete);
        return;
      }

      complete();
    });
  }

  if (done) {
    return (
      <div className="px-5 pb-6 pt-6">
        <div className="rounded-[20px] border border-line/90 bg-surface p-5 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success-ink">
            <Icon name="check" size={28} />
          </span>
          <h1 className="mt-4 text-[22px] font-bold tracking-[-0.02em] text-ink">
            You are going
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted">
            {done.length} {done.length === 1 ? "booking" : "bookings"} confirmed.
          </p>
          <ul className="mt-4 space-y-1.5">
            {done.map((reference) => (
              <li key={reference} className="font-mono text-[12px] text-muted">
                {reference}
              </li>
            ))}
          </ul>
          <Link
            href="/bookings"
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-brand-solid text-[14px] font-bold text-white"
          >
            See my tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-28 pt-4">
      <header>
        <p className="text-[12.5px] font-medium text-muted">Tickets</p>
        <h1 className="mt-0.5 text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          Your checkout
        </h1>
      </header>

      {lines.length === 0 ? (
        <p className="mt-6 rounded-[16px] border border-dashed border-line-strong bg-surface/60 p-4 text-center text-[13px] text-muted">
          Your ticket basket is empty.
        </p>
      ) : (
        <>
          <ul className="mt-5 space-y-2">
            {lines.map((line) => (
              <li
                key={line.lineId}
                className="flex items-center gap-3 rounded-[14px] border border-line/90 bg-surface p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={line.image.src}
                  alt={line.image.alt}
                  className="h-12 w-12 shrink-0 rounded-[10px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink">{line.eventTitle}</p>
                  <p className="text-[12px] text-muted">
                    {line.tierName} × {line.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cart.setQuantity(line.lineId, line.quantity - 1)}
                    aria-label={`One fewer ${line.tierName} ticket`}
                    className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink"
                  >
                    <Icon name="minus" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => cart.setQuantity(line.lineId, line.quantity + 1)}
                    aria-label={`One more ${line.tierName} ticket`}
                    className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink"
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>
                <p className="w-16 shrink-0 text-right text-[13px] font-bold text-ink">
                  {cedis(line.price * line.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <PaymentMethods value={method} onChange={setMethod} allowCash={false} />
            <PaymentNote />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <span className="text-[14px] font-semibold text-muted">Total</span>
            <span className="text-[20px] font-bold tracking-[-0.02em] text-ink">{cedis(total)}</span>
          </div>

          <SignInGate
            label="Sign in to pay"
            className="mt-4 flex h-[50px] w-full items-center justify-center rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand"
          >
            <button
              type="button"
              onClick={checkout}
              disabled={isPending}
              className="mt-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand disabled:opacity-60"
            >
              {isPending ? "Holding your tickets." : `Pay ${cedis(total)}`}
              <Icon name="arrow-right" size={16} />
            </button>
          </SignInGate>
        </>
      )}
    </div>
  );
}
