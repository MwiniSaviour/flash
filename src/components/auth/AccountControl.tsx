"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/flash/Icon";
import { Avatar } from "@/components/flash/ui";
import { signInHref } from "@/lib/auth/return-to";
import { useSession } from "@/lib/auth/session";
import type { FlashUser } from "@/lib/flash/types";

/**
 * The account entry point.
 *
 * Signed-in customers get their avatar and profile. A guest gets a sign-in
 * action that returns them to the page they were browsing. Keyless fixture mode
 * always shows the demo customer.
 */
export function AccountControl({
  user,
  variant = "avatar",
  size = 36,
  className = "",
}: {
  user: FlashUser;
  variant?: "avatar" | "row";
  size?: number;
  className?: string;
}) {
  const { user: sessionUser, loading, demo } = useSession();
  const pathname = usePathname();

  if (!demo && !loading && !sessionUser) {
    if (variant === "row") {
      return (
        <Link
          href={signInHref(pathname)}
          className={`flex items-center gap-3 rounded-[12px] px-2 py-2 text-[13.5px] font-semibold text-brand-ink transition-colors hover:bg-brand-soft ${className}`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft">
            <Icon name="user" size={18} />
          </span>
          Sign in
        </Link>
      );
    }

    return (
      <Link
        href={signInHref(pathname)}
        className={`inline-flex h-9 items-center rounded-full bg-brand-soft px-3.5 text-[12.5px] font-bold text-brand-ink transition active:scale-95 ${className}`}
      >
        Sign in
      </Link>
    );
  }

  if (variant === "row") {
    return (
      <Link
        href="/profile"
        className={`flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors hover:bg-surface-2/70 ${className}`}
      >
        <Avatar
          src={user.avatarUrl}
          alt={`${user.name}'s profile photo`}
          name={user.name}
          size={38}
        />
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-ink">{user.name}</span>
          <span className="block truncate text-[12px] text-muted">View profile</span>
        </span>
      </Link>
    );
  }

  return (
    <Link href="/profile" aria-label="Your profile" className={`rounded-full ${className}`}>
      <Avatar
        src={user.avatarUrl}
        alt={`${user.name}'s profile photo`}
        name={user.name}
        size={size}
      />
    </Link>
  );
}
