"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { decideTicketRequestAsAdmin } from "@/lib/admin/actions";
import type { TicketRequest } from "@/lib/flash/types";

/** Sold-out requests, with a one-click decision for the platform. */
export function RequestQueue({ rows }: { rows: TicketRequest[] }) {
  const [done, setDone] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function decide(id: string, status: "fulfilled" | "declined") {
    setError(null);
    startTransition(async () => {
      const result = await decideTicketRequestAsAdmin({ requestId: id, status });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone((current) => ({ ...current, [id]: status }));
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-line-strong bg-surface/60 p-4 text-center text-[13px] text-muted">
        No ticket requests have come in.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p role="alert" className="text-[12.5px] text-danger-ink">
          {error}
        </p>
      ) : null}

      {rows.map((row) => (
        <div
          key={row.id}
          className="rounded-[16px] border border-line/90 bg-surface p-3.5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-ink">{row.eventTitle ?? "Event"}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {row.tierName ?? "Tier"} · {row.quantity} {row.quantity === 1 ? "seat" : "seats"}
              </p>
              <p className="mt-0.5 text-[12px] text-muted">
                {row.name} · {row.phone} · {row.email}
              </p>
              {row.note ? <p className="mt-1 text-[12px] text-muted">{row.note}</p> : null}
            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
                (done[row.id] ?? row.status) === "pending"
                  ? "bg-warning-soft text-warning"
                  : (done[row.id] ?? row.status) === "fulfilled"
                    ? "bg-success-soft text-success-ink"
                    : "bg-surface-2 text-muted"
              }`}
            >
              {done[row.id] ?? row.status}
            </span>
          </div>

          {row.status === "pending" && !done[row.id] ? (
            <div className="mt-3 flex gap-2 border-t border-line/70 pt-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => decide(row.id, "fulfilled")}
                className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-brand-solid px-3 text-[12.5px] font-bold text-white disabled:opacity-60"
              >
                <Icon name="check" size={14} />
                Fulfil
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => decide(row.id, "declined")}
                className="inline-flex h-9 items-center rounded-[10px] border border-line px-3 text-[12.5px] font-semibold text-ink disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
