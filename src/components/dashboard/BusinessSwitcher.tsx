import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { CONSOLE_LABEL, consoleHref, isConsoleBusiness } from "@/lib/flash/console";
import type { Business } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

/**
 * The business switcher.
 *
 * A manager can own more than one kitchen or events company. Every console
 * gets its own URL, so switching is just a link — no client state, no cookie,
 * nothing to keep in sync. Pending businesses are listed too: the console
 * opens so the owner can see it while the application is being read.
 */
export function BusinessSwitcher({
  businesses,
  currentId,
  onNavigate,
  className,
}: {
  businesses: Business[];
  currentId: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const consoles = businesses.filter(isConsoleBusiness);
  if (consoles.length < 2) return null;

  return (
    <nav aria-label="Switch business" className={className}>
      <p className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-soft">
        Your businesses
      </p>
      <ul className="mt-1.5 space-y-0.5">
        {consoles.map((business) => {
          const current = business.id === currentId;

          return (
            <li key={business.id}>
              <Link
                href={consoleHref(business.kind, business.id)}
                aria-current={current ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 transition-colors",
                  current
                    ? "bg-surface font-semibold text-ink shadow-[0_1px_2px_rgb(23_26_31/0.05)]"
                    : "font-medium text-muted hover:bg-surface-2/70 hover:text-ink",
                )}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-surface-2 text-icon-idle">
                  <Icon name={business.kind === "restaurant" ? "bowl" : "ticket"} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px]">{business.name}</span>
                  <span className="block truncate text-[11.5px] text-muted">
                    {CONSOLE_LABEL[business.kind]}
                  </span>
                </span>
                {current ? (
                  <Icon name="check" size={15} className="shrink-0 text-brand" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
