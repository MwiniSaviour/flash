"use client";

import { SignOutButton } from "@clerk/nextjs";

import { useSession } from "@/lib/auth/session";

/**
 * Clerk's sign-out button only when Clerk is mounted. Keyless demo mode has no
 * provider (and no session to end), so it shows a quiet disabled control.
 */
export function SignOutControl() {
  const { demo } = useSession();

  if (demo) {
    return (
      <button
        type="button"
        disabled
        title="Demo mode"
        className="w-full cursor-not-allowed px-3 py-2 text-left text-[13.5px] font-semibold text-muted-soft"
      >
        Sign out
      </button>
    );
  }

  return (
    <div className="px-3 py-2">
      <SignOutButton>Sign out</SignOutButton>
    </div>
  );
}
