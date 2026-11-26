import { notificationHref } from "./copy";
import type { DeviceToken, NotifyInput } from "./types";

export * from "./copy";
export type { DeviceToken, NotifyInput } from "./types";

export function splitTokens(tokens: DeviceToken[]) {
  return {
    web: tokens.filter((token) => token.platform === "web"),
    native: tokens.filter(
      (token) => token.platform === "fcm" || token.platform === "android" || token.platform === "ios",
    ),
  };
}

export function webPushPayload(input: NotifyInput) {
  return {
    title: input.title,
    body: input.body,
    url: notificationHref(input.refType, input.refId),
    kind: input.kind,
    refType: input.refType ?? null,
    refId: input.refId ?? null,
    speakText: input.speakText ?? null,
    voiceAlert: input.priority === "high" ? "true" : "false",
  };
}

export function fcmMessage(token: string, input: NotifyInput): {
  token: string;
  notification: { title: string; body: string };
  data: Record<string, string>;
  android: { priority: string };
} {
  const message: {
    token: string;
    notification: { title: string; body: string };
    data: Record<string, string>;
    android: { priority: string };
  } = {
    token,
    notification: { title: input.title, body: input.body },
    data: {
      kind: input.kind,
      refType: input.refType ?? "",
      refId: input.refId ?? "",
      speakText: input.speakText ?? "",
      voiceAlert: input.priority === "high" ? "true" : "false",
      url: notificationHref(input.refType, input.refId),
    },
    android: { priority: input.priority === "high" ? "HIGH" : "NORMAL" },
  };
  return message;
}

export function anySent(statuses: ("skipped" | "sent" | "failed")[]) {
  if (statuses.includes("sent")) return "sent" as const;
  if (statuses.includes("failed")) return "failed" as const;
  return "skipped" as const;
}
