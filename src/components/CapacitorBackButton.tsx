"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

/** Hardware back handling for the Android shell; a no-op on the web. */
export function CapacitorBackButton() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle: { remove: () => void } | null = null;
    void App.addListener("backButton", () => {
      if (window.history.length > 1) window.history.back();
      else void App.exitApp();
    }).then((listener) => {
      handle = listener;
    });

    return () => {
      handle?.remove();
    };
  }, []);

  return null;
}
