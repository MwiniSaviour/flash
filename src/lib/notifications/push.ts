import "server-only";

import { createSign } from "node:crypto";

import * as webpush from "web-push";

import { getEnv, hasFcmEnv, hasWebPushEnv } from "@/lib/env";
import type { AdminClient } from "@/lib/supabase/admin";

import { anySent, fcmMessage, splitTokens, webPushPayload } from "./payload";
import type { ChannelStatus, DeviceToken, NotifyInput } from "./types";

type ServiceAccount = { project: string; clientEmail: string; privateKey: string };
let cachedServiceAccount: ServiceAccount | null | undefined;

function serviceAccount(): ServiceAccount | null {
  if (cachedServiceAccount !== undefined) return cachedServiceAccount;
  const env = getEnv();
  if (!env.fcmProjectId || !env.fcmServiceAccountJson) {
    cachedServiceAccount = null;
    return cachedServiceAccount;
  }
  try {
    const parsed = JSON.parse(env.fcmServiceAccountJson) as {
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.client_email || !parsed.private_key) throw new Error("incomplete service account");
    cachedServiceAccount = {
      project: env.fcmProjectId,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch (error) {
    console.error("[notifications] invalid FCM_SERVICE_ACCOUNT_JSON", error);
    cachedServiceAccount = null;
  }
  return cachedServiceAccount;
}

const base64url = (value: Buffer | string) =>
  Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

let cachedToken: { value: string; expiresAt: number } | null = null;

async function fcmAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: sa.clientEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signature = createSign("RSA-SHA256")
    .update(`${header}.${claim}`)
    .sign(sa.privateKey);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${base64url(signature)}`,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`FCM token exchange failed (${response.status})`);
  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("FCM token exchange returned no access token");
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

async function sendNative(token: string, input: NotifyInput): Promise<boolean> {
  const sa = serviceAccount();
  if (!sa) return false;
  const message = fcmMessage(token, input);
  const accessToken = await fcmAccessToken(sa);
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project}/messages:send`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) {
    console.error(`[notifications] FCM send failed (${response.status})`);
    return false;
  }
  return true;
}

async function loadTokens(client: AdminClient, userId: string): Promise<DeviceToken[]> {
  const { data, error } = await client
    .from("notification_tokens")
    .select("token, user_id, platform, app_id, p256dh, auth")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    token: row.token,
    userId: row.user_id,
    platform: row.platform as DeviceToken["platform"],
    appId: row.app_id,
    p256dh: row.p256dh,
    auth: row.auth,
  }));
}

async function dropToken(client: AdminClient, token: string): Promise<void> {
  await client.from("notification_tokens").delete().eq("token", token);
}

export async function dispatchPush(
  input: NotifyInput,
  client: AdminClient | null,
): Promise<ChannelStatus> {
  if (!hasWebPushEnv() && !hasFcmEnv()) return "skipped";
  const tokens = client ? await loadTokens(client, input.userId) : [];
  if (tokens.length === 0) return "skipped";
  const { web, native } = splitTokens(tokens);
  const payload = JSON.stringify(webPushPayload(input));
  const env = getEnv();

  const webResults: boolean[] = [];
  if (hasWebPushEnv()) {
    webpush.setVapidDetails(env.vapidSubject!, env.vapidPublicKey!, env.vapidPrivateKey!);
    for (const token of web) {
      if (!token.p256dh || !token.auth) continue;
      try {
        await webpush.sendNotification(
          { endpoint: token.token, keys: { p256dh: token.p256dh, auth: token.auth } },
          payload,
        );
        webResults.push(true);
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          if (client) await dropToken(client, token.token);
        } else {
          console.error("[notifications] Web Push send failed", error);
        }
        webResults.push(false);
      }
    }
  }

  const nativeResults = await Promise.all(
    hasFcmEnv()
      ? native.map(async (token) => {
          try {
            return await sendNative(token.token, input);
          } catch (error) {
            console.error("[notifications] FCM send error", error);
            return false;
          }
        })
      : [],
  );

  return anySent([...webResults, ...nativeResults].map((ok) => (ok ? "sent" : "failed")));
}
