import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import type { AdminActivity } from "@/lib/flash/admin-repository";

/** Small side panels on the admin overview. */
export function RecentActivityPanel({ activity }: { activity: AdminActivity[] }) {
  return (
    <section className="rounded-[16px] border border-line/90 bg-surface p-4">
      <h2 className="text-[15px] font-bold text-ink">Recent activity</h2>
      <ul className="mt-3 space-y-3">
        {activity.length === 0 ? (
          <li className="text-[12.5px] text-muted">Nothing has happened in this window.</li>
        ) : (
          activity.slice(0, 6).map((item) => (
            <li key={item.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
                <Icon name="clock" size={13} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-ink">
                  {item.label}
                </span>
                <span className="block truncate text-[11.5px] text-muted">{item.detail}</span>
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export function ApprovalsPanel({ pending }: { pending: number }) {
  return (
    <section className="rounded-[16px] border border-line/90 bg-surface p-4">
      <h2 className="text-[15px] font-bold text-ink">Waiting on you</h2>
      <p className="mt-1 text-[12.5px] text-muted">
        {pending === 0 ? "No business is waiting for a decision." : `${pending} applications to review.`}
      </p>
      <Link
        href="/admin/approvals"
        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-brand-solid px-3 text-[12.5px] font-bold text-white transition hover:bg-brand-solid-hover"
      >
        Review applications
        <Icon name="arrow-right" size={13} />
      </Link>
    </section>
  );
}
