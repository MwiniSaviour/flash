"use client";

import { useRouter } from "next/navigation";

import { useLiveEvents } from "@/lib/live/client";

/**
 * Keeps a delivery's tracking current.
 *
 * The screen is rendered from the repository on the server. The authenticated
 * SSE endpoint emits a refresh signal when one of the signed-in customer's
 * delivery rows changes; the router then re-renders the card, from/to pair and
 * courier details from Postgres instead of a value frozen at page load. The
 * polling hook on the screen remains the fallback when the stream is closed.
 */
export function useLiveTracking(
  deliveryId: string | undefined,
  kind: "ride" | "parcel" | "order" | undefined,
) {
  const router = useRouter();
  useLiveEvents(() => router.refresh(), Boolean(deliveryId && kind));
}
