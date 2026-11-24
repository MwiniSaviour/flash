"use client";

import { useEffect, useRef } from "react";

/**
 * Browser side of the authenticated live stream.
 *
 * Only a refresh signal crosses the wire. The callback re-renders the current
 * server page; the page then reads real rows through the repository. No row
 * data, token or user id is sent by the browser.
 */
export function useLiveEvents(onRefresh: () => void, enabled = true): void {
  const callback = useRef(onRefresh);

  useEffect(() => {
    callback.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let disposed = false;

    const disconnect = () => {
      if (source) {
        source.close();
        source = null;
      }
    };

    const connect = () => {
      if (disposed || source || document.visibilityState !== "visible") return;

      source = new EventSource("/api/live");
      source.addEventListener("refresh", () => {
        attempt = 0;
        callback.current();
      });
      source.addEventListener("error", () => {
        disconnect();
        if (disposed || document.visibilityState !== "visible") return;
        const delay = Math.min(30000, 1000 * 2 ** attempt);
        attempt += 1;
        retry = setTimeout(connect, delay);
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (retry) {
          clearTimeout(retry);
          retry = undefined;
        }
        connect();
      } else {
        disconnect();
      }
    };

    connect();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      if (retry) clearTimeout(retry);
      document.removeEventListener("visibilitychange", onVisibility);
      disconnect();
    };
  }, [enabled]);
}
