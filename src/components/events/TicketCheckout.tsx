"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { PaymentMethods, PaymentNote, type PaymentMethodId } from "@/components/flash/PaymentMethods";
import { DateBadge } from "@/components/flash/ui";
import { bookTicket } from "@/lib/flash/actions";
import { cedis, dateBadge, distance, priceLabel } from "@/lib/flash/format";
import type { Event } from "@/lib/flash/types";

/**
 * Ticket checkout: what you are buying, what it costs, how you are paying.
 *
 * Confirming produces a booking reference and a ticket in the wallet — the
 * whole promise of the product in three screens.
 */
export function TicketCheckout({
  event,
  tierId,
  quantity,
}: {
  event: Event;
  tierId: string;
  quantity: number;
}) {
  const [method, setMethod] = useState<PaymentMethodId>("momo");
  const [booked, setBooked] = useState<{ reference: string; total: number; demo: boolean } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tier = event.tiers.find((item) => item.id === tierId) ?? event.tiers[0];
  const badge = dateBadge(event.date);
  const subtotal = tier ? tier.price * quantity : 0;
  const total = subtotal;
  const isFree = total === 0;

  function confirm() {
    setError(null);

    startTransition(async () => {
      const result = await bookTicket({
        eventId: event.id,
        tierId: tier?.id ?? "",
        quantity,
        paymentMethod: method === "cash" ? "cash" : "online",
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.data.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
        return;
      }

      setBooked({
        reference: result.data.reference,
        total: result.data.total,
        demo: result.data.demo,
      });
    });
  }

  if (booked) {
    return (
      <div className="px-5 pb-6 pt-6">
        <div className="rounded-[20px] border border-line/90 bg-surface p-5 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success-ink">
            <Icon name="check" size={28} />
          </span>
          <h1 className="mt-4 text-[22px] font-bold tracking-[-0.02em] text-ink">You are going</h1>
          <p className="mx-auto mt-1.5 max-w-[34ch] text-[13.5px] leading-relaxed text-muted">
            {quantity} {quantity === 1 ? "ticket" : "tickets"} to {event.title}. The wallet now holds
            your booking reference.
          </p>

          <div className="mt-4 rounded-[14px] bg-surface-2/70 px-4 py-3">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              Booking reference
            </p>
            <p className="mt-1 font-mono text-[18px] font-bold tracking-[0.06em] text-ink">
              {booked.reference}
            </p>
          </div>

          <p className="mt-3 text-[13px] font-semibold text-brand-ink">
            Total {priceLabel(booked.total)}
          </p>

          {booked.demo ? (
            <p className="mt-1.5 text-[12px] text-muted-soft">
              Demo mode — no database is connected, so nothing was saved.
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-2">
            <Link
              href="/bookings"
              className="flex h-[48px] items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover"
            >
              See my tickets
              <Icon name="arrow-right" size={16} />
            </Link>
            <Link
              href={`/events/${event.slug}`}
              className="flex h-[46px] items-center justify-center rounded-[12px] border border-line bg-surface text-[14px] font-semibold text-ink"
            >
              Back to the event
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <header className="flex items-center gap-3 px-5 pt-3">
        <Link
          href={`/events/${event.slug}`}
          aria-label="Back to the event"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink transition active:scale-95"
        >
          <Icon name="chevron-left" size={19} />
        </Link>
        <h1 className="text-[20px] font-bold tracking-[-0.02em] text-ink">Checkout</h1>
      </header>

      <div className="mt-4 px-5">
        <div className="flex items-start gap-3 rounded-[16px] border border-line/90 bg-surface p-3">
          <span className="relative block h-[74px] w-[74px] shrink-0 overflow-hidden rounded-[12px] bg-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.image.src} alt={event.image.alt} className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold leading-tight text-ink">
              {event.title}
            </span>
            <span className="mt-1 block truncate text-[12.5px] text-muted">
              {event.venue} · {distance(event.distanceKm)}
            </span>
            <span className="mt-2 flex items-center gap-2">
              <DateBadge {...badge} size="sm" />
              <span className="text-[12.5px] text-muted">
                {tier?.name} × {quantity}
              </span>
            </span>
          </span>
        </div>
      </div>

      <div className="mt-4 px-5">
        <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">Order summary</h2>
        <dl className="mt-2.5 space-y-2 rounded-[14px] border border-line/90 bg-surface p-3.5 text-[13.5px]">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">
              {tier?.name} × {quantity}
            </dt>
            <dd className="font-semibold text-ink">{priceLabel(subtotal)}</dd>
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 border-t border-line/80 pt-2.5">
            <dt className="font-bold text-ink">Total</dt>
            <dd className="text-[17px] font-bold tracking-[-0.02em] text-ink">{priceLabel(total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 px-5">
        {isFree ? (
          <p className="text-[13px] leading-relaxed text-muted">
            This event is free. Your place is confirmed when you reserve it.
          </p>
        ) : (
          <>
            <PaymentMethods value={method} onChange={setMethod} allowCash={false} />
            <PaymentNote />
          </>
        )}
      </div>

      <div className="mt-6 px-5">
        {error ? (
          <p
            role="alert"
            className="mb-3 rounded-[12px] border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger-ink"
          >
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={confirm}
          disabled={isPending}
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover active:bg-brand-solid-pressed disabled:opacity-80"
        >
          {isPending ? "Holding your ticket…" : `Pay ${cedis(total)}`}
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </div>
  );
}
