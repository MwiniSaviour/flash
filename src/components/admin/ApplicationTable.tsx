"use client";

import { useState, useTransition } from "react";

import { decideApplication } from "@/lib/admin/actions";
import type { AdminApplication } from "@/lib/flash/admin-repository";

/** The approval queue: one decision per business application. */
export function ApplicationTable({ rows }: { rows: AdminApplication[] }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function decide(id: string, status: "approved" | "declined") {
    setError(null);
    startTransition(async () => {
      const result = await decideApplication(id, status);
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
        No applications yet.
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
          className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line/90 bg-surface p-3.5"
        >
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-ink">{row.name}</p>
            <p className="mt-0.5 text-[12px] text-muted">
              {row.kind} · {row.neighbourhood} · {row.status}
            </p>
          </div>

          {row.status === "pending" ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => decide(row.id, "approved")}
                className="h-9 rounded-[10px] bg-brand-solid px-3 text-[12.5px] font-bold text-white disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => decide(row.id, "declined")}
                className="h-9 rounded-[10px] border border-line bg-surface px-3 text-[12.5px] font-semibold text-ink disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          ) : (
            <span className="text-[12px] font-semibold text-success-ink">
              {done[row.id] ?? row.status}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
