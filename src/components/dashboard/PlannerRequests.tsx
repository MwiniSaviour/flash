"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { useToast } from "@/components/flash/ToastProvider";
import { decideTicketRequest } from "@/lib/flash/business-actions";
import type { TicketRequest } from "@/lib/flash/types";

/** Requests for a sold-out tier, decided by the event planner. */
export function PlannerRequests({ rows }: { rows: TicketRequest[] }) {
  const [done, setDone] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const notify = useToast();

  function decide(id: string, status: "fulfilled" | "declined") {
    startTransition(async () => {
      const result = await decideTicketRequest({ requestId: id, status });
      if (!result.ok) {
        notify(result.error);
        return;
      }
      setDone((current) => ({ ...current, [id]: status }));
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-line-strong bg-surface/60 p-4 text-center text-[13px] text-muted">
        No requests are waiting.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="rounded-[16px] border border-line/90 bg-surface p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-ink">{row.eventTitle ?? "Event"}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {row.tierName ?? "Tier"} · {row.name} · {row.quantity}{" "}
                {row.quantity === 1 ? "place" : "places"}
              </p>
              <p className="mt-0.5 text-[12px] text-muted">
                {row.phone} · {row.email}
              </p>
              {row.note ? <p className="mt-1 text-[12px] text-muted">{row.note}</p> : null}
            </div>
            <span className="shrink-0 rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warning">
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
