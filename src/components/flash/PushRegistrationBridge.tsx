"use client";

import { useEffect } from "react";

import { registerNativePush, subscribeWebPush } from "@/lib/notifications/client";

export function PushRegistrationBridge() {
  useEffect(() => {
    void registerNativePush();
    void subscribeWebPush(false);
  }, []);
  return null;
}
