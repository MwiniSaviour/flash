"use client";

import { ProfileControl } from "@/components/auth/ProfileControl";
import type { FlashUser } from "@/lib/flash/types";

/**
 * The account entry point, now the shared profile control: one avatar/menu for
 * the customer app, the console and the superadmin, with Clerk account and
 * password management behind it.
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
  return <ProfileControl user={user} variant={variant} size={size} className={className} />;
}
