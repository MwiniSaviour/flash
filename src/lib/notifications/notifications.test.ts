import { describe, expect, it } from "vitest";

import {
  anySent,
  completionCopy,
  fcmMessage,
  managerSaleCopy,
  notificationHref,
  paymentCopy,
  purchaseCopy,
  splitTokens,
  vendorOrderCopy,
  webPushPayload,
  type DeviceToken,
  type NotifyInput,
} from "./payload";

const input: NotifyInput = {
  userId: "usr-1",
  kind: "purchase_confirmed",
  title: "Order confirmed",
  body: "GHS 42.50 · FLS-1234-5678",
  refType: "order",
  refId: "ord-1",
  priority: "normal",
};

describe("notification copy", () => {
  it("maps each ref type to its screen", () => {
    expect(notificationHref("order", "ord-1")).toBe("/orders/ord-1");
    expect(notificationHref("ticket", "tkt-1")).toBe("/tickets/tkt-1");
    expect(notificationHref("ride", "ride-1")).toBe("/rides/ride-1");
    expect(notificationHref("parcel", "par-1")).toBe("/parcels/par-1");
    expect(notificationHref(null, null)).toBe("/profile/notifications");
  });

  it("builds real copy for each audience", () => {
    expect(purchaseCopy("order", "FLS-1", 42.5).title).toBe("Order confirmed");
    expect(vendorOrderCopy("Jollof Joint", 3, "12345678").body).toContain("3 items");
    expect(managerSaleCopy("Urban Vibes", "VIP", 2).title).toBe("New ticket sale");
    expect(paymentCopy(42.5, "FLS-1").title).toBe("Payment received");
    const done = completionCopy("order", "FLS-1");
    expect(done.title).toBe("Order completed");
    expect(done.email).toContain("Thank you for ordering with Flash");
  });
});

describe("push payloads", () => {
  const tokens: DeviceToken[] = [
    { token: "web-1", platform: "web", p256dh: "p", auth: "a", userId: "usr-1", appId: "flash" },
    { token: "fcm-1", platform: "android", userId: "usr-1", appId: "flash" },
    { token: "fcm-2", platform: "ios", userId: "usr-1", appId: "flash" },
  ];

  it("splits tokens by transport", () => {
    const { web, native } = splitTokens(tokens);
    expect(web).toHaveLength(1);
    expect(native.map((token) => token.platform)).toEqual(["android", "ios"]);
  });

  it("builds a web payload with a destination", () => {
    expect(webPushPayload(input)).toEqual({
      title: "Order confirmed",
      body: "GHS 42.50 · FLS-1234-5678",
      url: "/orders/ord-1",
      kind: "purchase_confirmed",
      refType: "order",
      refId: "ord-1",
      speakText: null,
      voiceAlert: "false",
    });
  });

  it("builds an FCM v1 message with data and priority", () => {
    const message = fcmMessage("fcm-1", input);
    expect(message.token).toBe("fcm-1");
    expect(message.android.priority).toBe("NORMAL");
    expect(message.data.url).toBe("/orders/ord-1");
    expect(message.notification.title).toBe("Order confirmed");
  });

  it("treats any sent channel as sent", () => {
    expect(anySent(["skipped", "sent"])).toBe("sent");
    expect(anySent(["skipped", "skipped"])).toBe("skipped");
    expect(anySent(["failed", "failed"])).toBe("failed");
  });
});
