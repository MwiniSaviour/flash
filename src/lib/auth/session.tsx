"use client";

import { ClerkProvider, useUser } from "@clerk/nextjs";
import { createContext, useContext, type ReactNode } from "react";

import { getEnv } from "@/lib/env";
import type { FlashUser } from "@/lib/flash/types";

/**
 * The session seam.
 *
 * Flash runs signed-in as a demo customer until Clerk is connected. When
 * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is present the real Clerk session is
 * mounted and mapped onto the same `FlashUser` shape the screens already read,
 * so nothing downstream changes.
 *
 * Payment collection (Mobile Money / card) belongs to the same moment: it is a
 * Clerk + Supabase concern, not a UI one, and no screen invents a payment
 * provider it does not have.
 */

interface SessionValue {
  user: FlashUser | null;
  /** True while the real provider is still resolving. */
  loading: boolean;
  /** True when the session is the seeded demo customer. */
  demo: boolean;
}

const SessionContext = createContext<SessionValue>({
  user: null,
  loading: false,
  demo: true,
});

const demoUser: FlashUser = {
  id: "usr-saviour-mwini",
  name: "Saviour Mwini",
  email: "saviour@flash.gh",
  avatarUrl: "/assets/images/avatar-saviour.jpg",
  memberSince: "March 2025",
  notificationsEnabled: true,
};

function ClerkSession({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();

  const value: SessionValue = {
    loading: !isLoaded,
    demo: false,
    user: user
      ? {
          id: user.id,
          name:
            user.fullName ||
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            "Flash customer",
          email: user.primaryEmailAddress?.emailAddress ?? "",
          avatarUrl: user.imageUrl,
          memberSince: "Flash customer",
          notificationsEnabled: true,
        }
      : null,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const publishableKey = getEnv().clerkPublishableKey;

  if (!publishableKey) {
    return (
      <SessionContext.Provider
        value={{ user: demoUser, loading: false, demo: true }}
      >
        {children}
      </SessionContext.Provider>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <ClerkSession>{children}</ClerkSession>
    </ClerkProvider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
