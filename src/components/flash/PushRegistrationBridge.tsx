"use client";

import { useEffect } from "react";

import { registerNativePush, subscribeWebPush } from "@/lib/notifications/client";
import { registerFirebasePush } from "@/lib/notifications/firebase";

export function PushRegistrationBridge() {
  useEffect(() => {
    void registerNativePush();
    void subscribeWebPush(false);
    void registerFirebasePush();
  }, []);
  return null;
}
