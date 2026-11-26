"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/flash/Icon";
import { Avatar } from "@/components/flash/ui";
import { signInHref } from "@/lib/auth/return-to";
import { useSession } from "@/lib/auth/session";
import type { FlashUser } from "@/lib/flash/types";

/**
 * The one account control for every surface - customer app, business console
 * and superadmin. It always leads to the product's own profile and settings,
 * so the avatar never traps the reader in an overlay on their way there.
 */
export function ProfileControl({
  user,
  variant = "avatar",
  size = 36,
  className = "",
}: {
  user: FlashUser;
  variant?: "avatar" | "row" | "button";
  size?: number;
  className?: string;
}) {
  const { demo, loading, user: sessionUser } = useSession();
  const pathname = usePathname();
  const identity = sessionUser ?? user;
  const profileHref = pathname === "/profile" ? "/profile/settings" : "/profile";

  if (!demo) {
    if (loading) {
      return (
        <span
          className={`inline-block animate-pulse rounded-full bg-surface-2 ${className}`}
          style={{ width: size, height: size }}
          aria-hidden="true"
        />
      );
    }
    if (!sessionUser) {
      return (
        <Link
          href={signInHref(pathname)}
          className={`inline-flex h-9 items-center rounded-full bg-brand-soft px-3.5 text-[12.5px] font-bold text-brand-ink transition active:scale-95 ${className}`}
        >
          Sign in
        </Link>
      );
    }
  }

  if (variant === "button") {
    return (
      <Link
        href="/profile/settings"
        className={`inline-flex items-center gap-1.5 text-[13.5px] font-bold text-brand-ink transition-colors hover:text-brand ${className}`}
      >
        Edit profile
        <Icon name="chevron-right" size={14} />
      </Link>
    );
  }

  const avatar = (
    <Avatar
      src={identity.avatarUrl}
      alt={`${identity.name}'s profile photo`}
      name={identity.name}
      size={variant === "row" ? 38 : size}
    />
  );

  if (variant === "row") {
    return (
      <Link
        href={profileHref}
        className={`flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors hover:bg-surface-2/70 ${className}`}
      >
        {avatar}
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-ink">{identity.name}</span>
          <span className="block truncate text-[12px] text-muted">View profile</span>
        </span>
      </Link>
    );
  }

  return (
    <Link href={profileHref} aria-label="Your profile" className={`rounded-full ${className}`}>
      {avatar}
    </Link>
  );
}
