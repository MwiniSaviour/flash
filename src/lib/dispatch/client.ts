import "server-only";

import { getEnv } from "@/lib/env";

import type { CreateDispatchJobInput, DispatchJobDTO } from "./types";

/**
 * The server-only dispatch client.
 *
 * Flash never holds a customer's dispatch credential in the browser. The key
 * authenticates the product (the engine maps it to an app id), and the app id is
 * sent alongside it so a mistake is visible instead of silently landing in the
 * wrong tenant. Native fetch keeps the dependency list unchanged.
 */

/** True only when Flash can authenticate to the engine. */
export function dispatchConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.dispatchBaseUrl && env.dispatchApiKey && env.dispatchAppId);
}

function headers(): Record<string, string> {
  const env = getEnv();
  return {
    "content-type": "application/json",
    "x-jobfinder-key": env.dispatchApiKey ?? "",
    "x-app-id": env.dispatchAppId ?? "",
    accept: "application/json",
  };
}

async function request(path: string, init: RequestInit): Promise<DispatchJobDTO> {
  const base = getEnv().dispatchBaseUrl?.replace(/\/+$/, "");
  if (!base) throw new Error("Dispatch is not configured.");

  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: headers(),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Dispatch returned ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}.`);
  }

  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || typeof (data as { jobId?: unknown }).jobId !== "string") {
    throw new Error("Dispatch returned an unexpected response.");
  }

  return data as DispatchJobDTO;
}

/** Posts a new ride or parcel job. The engine deduplicates on idempotencyKey. */
export function createDispatchJob(input: CreateDispatchJobInput): Promise<DispatchJobDTO> {
  return request("/v1/jobs", { method: "POST", body: JSON.stringify(input) });
}

/** Polls one job's current DTO. Used only for active dispatched bookings. */
export function getDispatchJob(jobId: string): Promise<DispatchJobDTO> {
  return request(`/v1/jobs/${encodeURIComponent(jobId)}`, { method: "GET" });
}
