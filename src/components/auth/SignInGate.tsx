"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { signInHref } from "@/lib/auth/return-to";
import { useSession } from "@/lib/auth/session";

/**
 * The boundary between browsing and buying.
 *
 * A guest sees a sign-in link in place of the buy control and returns to the
 * same page after signing in. Keyless fixture mode has a demo customer and is
 * never gated; signed-in customers see the original control unchanged.
 */
export function SignInGate({
  children,
  className,
  label = "Sign in to continue",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const { user, loading, demo } = useSession();
  const pathname = usePathname();

  if (!demo && !loading && !user) {
    return (
      <Link href={signInHref(pathname)} className={className}>
        {label}
      </Link>
    );
  }

  return <>{children}</>;
}
