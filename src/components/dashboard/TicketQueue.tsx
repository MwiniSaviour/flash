"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { useToast } from "@/components/flash/ToastProvider";
import { confirmTicket } from "@/lib/flash/business-actions";
import type { Ticket } from "@/lib/flash/types";

/**
 * The ticket queue.
 *
 * Tickets sold are not bookings until the promoter says so: this is the list
 * of the ones waiting for a yes.
 */
export function TicketQueue({ tickets }: { tickets: Ticket[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const notify = useToast();

  function confirm(ticketId: string) {
    setBusy(ticketId);

    startTransition(async () => {
      const result = await confirmTicket({ ticketId });
      setBusy(null);
      if (!result.ok) notify(result.error);
    });
  }

  if (tickets.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-line-strong/70 bg-surface/60 px-4 py-6 text-center text-[13px] text-muted">
        Nothing waiting. Every ticket sold lands here to be confirmed.
      </p>
    );
  }

  return (
    <div>
      <ul className="space-y-2.5">
        {tickets.map((ticket) => {
          const waiting = ticket.status === "pending";

          return (
            <li key={ticket.id} className="flex items-center gap-3 rounded-[16px] border border-line/90 bg-surface p-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold tracking-[-0.01em] text-ink">
                  {ticket.tierName} × {ticket.quantity}
                </p>
                <p className="mt-0.5 font-mono text-[11.5px] tracking-[0.04em] text-muted">
                  {ticket.reference}
                </p>
                <p className="mt-1 text-[12px] text-muted-soft">
                  {waiting ? "Waiting for a yes" : "Confirmed"}
                </p>
              </div>

              {waiting ? (
                <button
                  type="button"
                  onClick={() => confirm(ticket.id)}
                  disabled={busy === ticket.id}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-brand-solid px-3 text-[13px] font-bold text-white transition hover:bg-brand-solid-hover disabled:opacity-60"
                >
                  <Icon name="check" size={14} />
                  Confirm
                </button>
              ) : (
                <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-success-soft px-3 text-[12.5px] font-semibold text-success-ink">
                  <Icon name="check" size={13} />
                  Confirmed
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
