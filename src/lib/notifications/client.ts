"use client";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(raw);
  return Uint8Array.from([...decoded].map((char) => char.charCodeAt(0)));
}

async function postToken(body: Record<string, unknown>): Promise<void> {
  await fetch("/api/notifications/tokens", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function subscribeWebPush(prompt: boolean): Promise<boolean> {
  if (!publicKey || typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  let permission = Notification.permission;
  if (permission === "default" && prompt) permission = await Notification.requestPermission();
  if (permission !== "granted") return false;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      }));
    const json = subscription.toJSON();
    await postToken({
      token: subscription.endpoint,
      platform: "web",
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    });
    return true;
  } catch (error) {
    console.error("[notifications] web push registration failed", error);
    return false;
  }
}

export async function registerNativePush(): Promise<void> {
  const capacitor = (window as unknown as {
    Capacitor?: { getPlatform?: () => string; Plugins?: Record<string, unknown> };
  }).Capacitor;
  const plugin = capacitor?.Plugins?.PushNotifications as
    | {
        requestPermission?: () => Promise<unknown>;
        register?: () => Promise<unknown>;
        addListener?: (event: string, callback: (data: { token?: string }) => void) => void;
      }
    | undefined;
  if (!plugin || !capacitor?.getPlatform) return;
  const platform = capacitor.getPlatform();
  if (platform !== "android" && platform !== "ios") return;
  try {
    await plugin.requestPermission?.();
    plugin.addListener?.("registration", ({ token }) => {
      if (token) void postToken({ token, platform, appId: "flash" });
    });
    await plugin.register?.();
  } catch (error) {
    console.error("[notifications] native push registration failed", error);
  }
}
