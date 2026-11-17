"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { confirmOrder, completeOrder } from "@/lib/flash/business-actions";
import type { Order } from "@/lib/flash/types";

/**
 * The order queue.
 *
 * What a kitchen does with the orders that come in: accept the ones waiting
 * for a yes, and close the ones that are done. Two buttons, one decision each.
 */
export function OrderQueue({ orders }: { orders: Order[] }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function act(orderId: string, action: "confirm" | "complete") {
    setError(null);
    setBusy(orderId);

    startTransition(async () => {
      const result =
        action === "confirm"
          ? await confirmOrder({ orderId })
          : await completeOrder({ orderId });

      setBusy(null);
      if (!result.ok) setError(result.error);
    });
  }

  if (orders.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-line-strong/70 bg-surface/60 px-4 py-6 text-center text-[13px] text-muted">
        No orders waiting. They land here the moment a customer places one.
      </p>
    );
  }

  return (
    <div>
      {error ? (
        <p
          role="alert"
          className="mb-2 rounded-[12px] border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger-ink"
        >
          {error}
        </p>
      ) : null}

      <ul className="space-y-2.5">
        {orders.map((order) => {
          const waiting = order.status === "awaiting confirmation";

          return (
            <li
              key={order.id}
              className="rounded-[16px] border border-line/90 bg-surface p-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-bold tracking-[-0.01em] text-ink">
                    #{order.number}
                  </p>
                  <p className="mt-0.5 font-mono text-[11.5px] tracking-[0.04em] text-muted">
                    {order.reference}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-[4px] text-[11.5px] font-semibold leading-none ${
                    waiting ? "bg-warning-soft text-warning" : "bg-brand-soft text-brand-ink"
                  }`}
                >
                  {waiting ? "Needs a yes" : "Being prepared"}
                </span>
              </div>

              <ul className="mt-2.5 space-y-1">
                {order.lines.map((line) => (
                  <li key={line.menuItemId} className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-ink">
                      {line.name}
                      <span className="text-muted"> × {line.quantity}</span>
                    </span>
                    <span className="text-[12.5px] text-muted">GHC{line.price}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-muted">
                <Icon
                  name={order.fulfilment === "delivery" ? "bag" : "bowl"}
                  size={13}
                  className="shrink-0 text-muted-soft"
                />
                {order.fulfilment === "delivery"
                  ? `Deliver to ${order.address}`
                  : order.fulfilment === "pickup"
                    ? "Collected at the counter"
                    : "Eaten in"}
              </p>

              <div className="mt-3 flex items-center gap-2">
                {waiting ? (
                  <button
                    type="button"
                    onClick={() => act(order.id, "confirm")}
                    disabled={busy === order.id}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-brand-solid px-3 text-[13px] font-bold text-white transition hover:bg-brand-solid-hover disabled:opacity-60"
                  >
                    <Icon name="check" size={14} />
                    Accept the order
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => act(order.id, "complete")}
                    disabled={busy === order.id}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-surface px-3 text-[13px] font-semibold text-ink transition hover:bg-surface-2 disabled:opacity-60"
                  >
                    <Icon name="check" size={14} />
                    Mark delivered
                  </button>
                )}

                <span className="text-[12px] text-muted-soft">
                  GHC{order.subtotal + order.deliveryFee}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
