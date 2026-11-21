"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keep a screen fresh while the customer is looking at it.
 *
 * This is the fallback for the realtime delivery channel: the server re-reads
 * the rows and the router swaps in the new markup. The
 * interval stops while the tab is hidden, so a phone in a pocket does not
 * spend its battery refreshing a screen nobody is watching.
 */
export function useLiveRefresh(intervalMs = 15000) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => router.refresh(), intervalMs);
    };

    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = undefined;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, router]);
}
