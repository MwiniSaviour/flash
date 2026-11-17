import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { EmptyState } from "@/components/flash/ui";

/**
 * The missing screen.
 *
 * A booking that is not there any more is not an error — the customer simply
 * followed a link that has expired.
 */
export default function NotFound() {
  return (
    <div className="px-5 pt-8">
      <EmptyState
        message="That is not here any more. It may have been a one-time link, or the booking belongs to another account."
        action="Back to Bookings"
        href="/bookings"
      />

      <Link
        href="/"
        className="mt-4 flex h-[46px] items-center justify-center gap-2 rounded-[12px] border border-line bg-surface text-[14px] font-semibold text-ink"
      >
        <Icon name="chevron-left" size={16} />
        Back to home
      </Link>
    </div>
  );
}
