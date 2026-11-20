import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { getEnv } from "@/lib/env";

/**
 * Clerk's proxy, with the admin host lock.
 *
 * Clerk owns the session, so it has to run before any route that reads one -
 * `auth()` on the server reads what the proxy established. Without keys there
 * is no session to read, so the proxy steps aside and lets the demo customer
 * through.
 *
 * In production the console is served only from ADMIN_HOST. A request for
 * /admin* on the public host is refused with 404 rather than redirected, so
 * the console is not advertised on the customer domain. Local development and
 * Vercel preview deployments are exempt.
 */
const clerk = clerkMiddleware();

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const env = getEnv();
  const { pathname, hostname } = request.nextUrl;

  if (
    process.env.VERCEL_ENV === "production" &&
    env.adminHost &&
    pathname.startsWith("/admin") &&
    hostname !== env.adminHost
  ) {
    return new NextResponse(null, { status: 404 });
  }

  if (env.adminHost && hostname === env.adminHost && pathname === "/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (!env.clerkPublishableKey) return NextResponse.next();
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
