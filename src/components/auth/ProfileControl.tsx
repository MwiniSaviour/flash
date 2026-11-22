"use client";

import { UserButton, useClerk } from "@clerk/nextjs";
import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { Avatar } from "@/components/flash/ui";
import { signInHref } from "@/lib/auth/return-to";
import { useSession } from "@/lib/auth/session";
import { usePathname } from "next/navigation";
import type { FlashUser } from "@/lib/flash/types";

/** Clerk's own account UI, themed with Flash tokens instead of hex literals. */
function appearanceFor(size: number) {
  return {
    variables: {
      colorPrimary: "var(--color-brand-solid)",
      colorText: "var(--color-ink)",
      colorTextSecondary: "var(--color-muted)",
      colorBackground: "var(--color-surface)",
      colorInputBackground: "var(--color-paper)",
      colorInputText: "var(--color-ink)",
      colorNeutral: "var(--color-line)",
      borderRadius: "11px",
      fontFamily: "inherit",
    },
    elements: {
      avatarBox: { width: size, height: size },
    },
  } as const;
}

function ClerkProfile({
  variant,
  size,
  className,
}: {
  variant: "avatar" | "row" | "button";
  size: number;
  className: string;
}) {
  const { openUserProfile } = useClerk();
  const buttonSize = Math.max(size, 32);

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={() => openUserProfile()}
        className={`inline-flex items-center gap-1.5 text-[13.5px] font-bold text-brand-ink transition-colors hover:text-brand ${className}`}
      >
        Edit profile
        <Icon name="chevron-right" size={14} />
      </button>
    );
  }

  const button = (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: buttonSize, height: buttonSize }}
    >
      <UserButton appearance={appearanceFor(buttonSize)} />
    </span>
  );

  if (variant === "row") {
    return <span className={`flex items-center gap-3 ${className}`}>{button}</span>;
  }

  return <span className={`inline-flex rounded-full ${className}`}>{button}</span>;
}

/**
 * The one account control for every Flash surface - customer app, business
 * console and superadmin. With Clerk it opens the managed profile / account /
 * password screens; in keyless demo mode it falls back to the local profile
 * page. It never links to a host-specific /profile route.
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
    return <ClerkProfile variant={variant} size={size} className={className} />;
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
      src={user.avatarUrl}
      alt={`${user.name}'s profile photo`}
      name={user.name}
      size={variant === "row" ? 38 : size}
    />
  );

  if (variant === "row") {
    return (
      <Link
        href="/profile"
        className={`flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors hover:bg-surface-2/70 ${className}`}
      >
        {avatar}
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-ink">{user.name}</span>
          <span className="block truncate text-[12px] text-muted">View profile</span>
        </span>
      </Link>
    );
  }

  return (
    <Link href="/profile" aria-label="Your profile" className={`rounded-full ${className}`}>
      {avatar}
    </Link>
  );
}
