import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { getEnv } from "@/lib/env";

/**
 * Clerk's proxy.
 *
 * Clerk owns the session, so it has to run before any route that reads one —
 * `auth()` on the server reads what the proxy established. Without keys there
 * is no session to read, so the proxy steps aside and lets the demo customer
 * through.
 */
const clerk = clerkMiddleware();

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!getEnv().clerkPublishableKey) return NextResponse.next();
  return clerk(request, event);
}

export const config = {
  matcher: [
    // Everything that is not a static asset.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|txt|map)).*)",
    // Route handlers and server actions.
    "/(api|trpc)(.*)",
  ],
};
