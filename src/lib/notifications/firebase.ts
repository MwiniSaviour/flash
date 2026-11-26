"use client";

import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function configured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId && vapidKey);
}

/**
 * Firebase Cloud Messaging for the browser. A token is registered against the
 * signed-in account so server-side notifications can address this device.
 * Foreground messages are shown by the page; background messages are handled
 * by firebase-messaging-sw.js.
 */
export async function registerFirebasePush(): Promise<boolean> {
  if (!configured() || typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || Notification.permission !== "granted") return false;
  if (!(await isSupported())) return false;

  const app = getApps().length ? getApp() : initializeApp(config);
  const messaging = getMessaging(app);

  onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "Flash";
    const body = payload.notification?.body ?? "";
    new Notification(title, {
      body,
      icon: "/icon.svg",
      tag: `flash-${payload.data?.kind ?? "notification"}`,
      data: { url: payload.data?.url ?? "/profile/notifications" },
    });
  });

  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) return false;

    const response = await fetch("/api/notifications/tokens", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, platform: "fcm", appId: "flash" }),
    });
    return response.ok;
  } catch (error) {
    console.error("[notifications] Firebase token registration failed", error);
    return false;
  }
}
