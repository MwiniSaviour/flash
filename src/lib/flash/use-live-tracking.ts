"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Keeps a delivery's tracking current.
 *
 * The screen is rendered from the repository on the server. A realtime change
 * to that delivery (status, driver, ETA) asks the router to re-render, so the
 * card, the from/to pair and the courier details all come from Postgres again
 * instead of a value frozen at page load. When no database is connected there
 * is no channel and the repository's seeded data is all there is to show.
 */
export function useLiveTracking(
  deliveryId: string | undefined,
  kind: "ride" | "parcel" | "order" | undefined,
) {
  const router = useRouter();

  useEffect(() => {
    if (!deliveryId || !kind) return;

    const supabase = createClient();
    if (!supabase) return;

    const table = kind === "ride" ? "rides" : kind === "parcel" ? "parcels" : "orders";
    const channel = supabase
      .channel(`flash-tracking-${deliveryId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `id=eq.${deliveryId}` },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [deliveryId, kind, router]);
}
