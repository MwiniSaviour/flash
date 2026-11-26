import Link from "next/link";

import { FlashLogo } from "@/components/flash/FlashLogo";
import { Icon } from "@/components/flash/Icon";
import { AccountControl } from "@/components/auth/AccountControl";
import type { FlashUser } from "@/lib/flash/types";

/**
 * The phone's brand header: the mark, search and the account.
 *
 * The account is deliberately not a tab — it lives behind the avatar here and
 * at the foot of the desktop rail.
 */
export function BrandHeader({ user }: { user: FlashUser }) {
  return (
    <header className="flex items-center justify-between px-5 pt-3.5 pb-3.5 lg:hidden">
      <Link href="/" aria-label="ScalDive — home">
        <FlashLogo />
      </Link>

      <div className="flex items-center gap-2.5">
        <Link
          href="/search"
          aria-label="Search events, venues, kitchens and rides"
          className="grid h-9 w-9 place-items-center rounded-full text-[#1d2532] transition active:scale-95"
        >
          <Icon name="search" size={21} />
        </Link>
        <AccountControl user={user} size={34} className="ring-[1.5px] ring-white/80 active:scale-95" />
      </div>
    </header>
  );
}
