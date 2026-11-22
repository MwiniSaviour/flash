import "server-only";

import { getEnv } from "@/lib/env";

import type { ChannelStatus } from "./types";

export async function sendEmail(
  to: string | null,
  subject: string,
  text: string,
): Promise<ChannelStatus> {
  const env = getEnv();
  if (!env.resendApiKey || !env.notificationsFromEmail || !to) return "skipped";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.resendApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.notificationsFromEmail,
        to: [to],
        subject,
        text: `${text}\n\n— Flash`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error(`[notifications] Resend send failed (${response.status})`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[notifications] Resend send error", error);
    return "failed";
  }
}
