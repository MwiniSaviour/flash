importScripts("https://www.gstatic.com/firebasejs/13.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.4.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD4oB1JFCLir8ln3_ONF6H-vYI2476gDqk",
  authDomain: "flash-scalmart.firebaseapp.com",
  projectId: "flash-scalmart",
  messagingSenderId: "230644728871",
  appId: "1:230644728871:web:603d8f6ca62dc41d88fa02",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  self.registration.showNotification(payload.notification?.title || "Flash", {
    body: payload.notification?.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: `flash-${data.kind || "notification"}`,
    data: { url: data.url || "/profile/notifications" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/profile/notifications";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((window) => new URL(window.url).origin === self.location.origin);
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      return clients.openWindow(url);
    }),
  );
});
