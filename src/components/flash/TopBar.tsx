import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { Avatar } from "@/components/flash/ui";
import type { FlashUser } from "@/lib/flash/types";

/**
 * The desktop top bar: search across all three services, notifications and the
 * account. It stays out of the phone layout, where each screen carries its own
 * header.
 */
export function TopBar({ user }: { user: FlashUser }) {
  return (
    <header className="no-print sticky top-0 z-20 hidden h-16 items-center gap-4 border-b border-line/70 bg-paper/90 px-6 backdrop-blur-xl lg:flex">
      <form
        action="/search"
        className="flex h-10 flex-1 max-w-[560px] items-center gap-2.5 rounded-full bg-surface-2 px-4 ring-1 ring-line/70 transition focus-within:ring-brand/45"
      >
        <Icon name="search" size={17} className="shrink-0 text-muted" />
        <input
          type="search"
          name="q"
          placeholder="Search Flash"
          aria-label="Search events, venues, kitchens and rides"
          className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-muted focus:outline-none"
        />
      </form>

      <button
        type="button"
        aria-label="Notifications"
        className="grid h-10 w-10 place-items-center rounded-full text-icon-idle transition-colors hover:bg-surface-2"
      >
        <Icon name="bell" size={20} />
      </button>

      <Link href="/profile" aria-label="Your profile" className="rounded-full">
        <Avatar src={user.avatarUrl} alt={`${user.name}'s profile photo`} name={user.name} size={36} />
      </Link>
    </header>
  );
}
