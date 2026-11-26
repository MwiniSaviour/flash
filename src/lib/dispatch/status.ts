/**
 * The one status adapter.
 *
 * The engine and ScalDive speak different words for the same journey. Every screen
 * that moves something — Track, the bookings ledger, the ride and parcel cards —
 * reads its stage, label, progress and step through this module. There is no
 * second lookup table hidden in a mapper.
 */

import type { DeliveryStage } from "@/lib/flash/data/tracking";
import type { DriverRow } from "@/lib/flash/rows";

import type { DispatchJobDTO, DispatchRequestType } from "./types";

export type DispatchView = {
  stage: DeliveryStage;
  label: string;
  /** 0 → 1 along the route. */
  progress: number;
  /** Index of the current step; steps.length once the job is finished. */
  step: number;
  /** False for scheduled and finished jobs: no route animation or live ETA. */
  active: boolean;
};

const STATES: Record<string, DispatchView> = {
  scheduled: { stage: "scheduled", label: "Scheduled", progress: 0.04, step: 0, active: false },
  due: { stage: "preparing", label: "Pick-up due", progress: 0.1, step: 0, active: true },
  unassigned: { stage: "preparing", label: "Finding a rider", progress: 0.12, step: 0, active: true },
  offered: { stage: "preparing", label: "Rider offered", progress: 0.18, step: 0, active: true },
  accepted: { stage: "preparing", label: "Rider assigned", progress: 0.3, step: 1, active: true },
  "picked-up": { stage: "on the way", label: "Picked up", progress: 0.48, step: 2, active: true },
  "en-route": { stage: "on the way", label: "On the way", progress: 0.68, step: 2, active: true },
  arriving: { stage: "arriving", label: "Arriving", progress: 0.84, step: 2, active: true },
  delivered: { stage: "delivered", label: "Delivered", progress: 1, step: 4, active: false },
  failed: { stage: "preparing", label: "Not completed", progress: 0, step: 0, active: false },
  returned: { stage: "preparing", label: "Returned", progress: 0, step: 0, active: false },
};

/** ScalDive's older status words, normalised to the engine's vocabulary. */
const LEGACY: Record<string, string> = {
  requested: "unassigned",
  booked: "unassigned",
  assigned: "accepted",
  accepted: "accepted",
  "in progress": "en-route",
  arriving: "arriving",
  "picked up": "picked-up",
  completed: "delivered",
  delivered: "delivered",
  cancelled: "failed",
  failed: "failed",
  returned: "returned",
};

export function canonicalState(status: string | null | undefined): string {
  if (!status) return "unassigned";
  const key = status.trim().toLowerCase().replace(/_/g, "-");
  return LEGACY[key] ?? key;
}

/**
 * The canonical read. `scheduledFor` only matters for a stale `scheduled`
 * snapshot: once its window has opened it is treated as due, but never before.
 */
export function adaptDispatchStatus(
  status: string | null | undefined,
  scheduledFor?: string | null,
  now = Date.now(),
): DispatchView {
  let state = canonicalState(status);

  if (state === "scheduled" && scheduledFor) {
    const moment = new Date(scheduledFor).getTime();
    if (Number.isFinite(moment) && moment <= now) state = "due";
  }

  return STATES[state] ?? STATES.unassigned;
}

/** The status ScalDive stores locally, always one the table's CHECK accepts. */
export function flashStatusForEngine(
  status: string | null | undefined,
  kind: DispatchRequestType,
): string {
  const state = canonicalState(status);

  if (state === "scheduled" || state === "due" || state === "offered" || state === "en-route") {
    return state;
  }
  if (state === "delivered") return kind === "ride" ? "completed" : "delivered";
  if (state === "failed" || state === "returned") return "cancelled";
  if (state === "picked-up") return kind === "ride" ? "accepted" : "picked up";
  if (state === "accepted") return kind === "ride" ? "accepted" : "assigned";
  if (state === "arriving") return kind === "ride" ? "arriving" : "assigned";
  return kind === "ride" ? "requested" : "booked";
}

export function isDispatchTerminal(status: string | null | undefined): boolean {
  const state = canonicalState(status);
  return state === "delivered" || state === "failed" || state === "returned" || state === "cancelled";
}

/** The engine's driver, folded into ScalDive's existing drivers catalogue shape. */
export function driverFromDispatchJob(job: DispatchJobDTO): DriverRow | null {
  const driver = job.task?.driver ?? job.driver;
  if (!driver?.name) return null;

  return {
    id: driver.id ?? `dispatch_${job.jobId}`,
    name: driver.name,
    rating: driver.rating ?? 0,
    photo_src: driver.photoSrc ?? "",
    photo_alt: driver.photoAlt ?? `Portrait of ${driver.name}, the rider on this delivery`,
    plate: driver.plate ?? "",
    vehicle: driver.vehicle ?? "",
    completed_rides: 0,
  };
}

/** The full local snapshot written after a create or a poll. */
export function dispatchPatch(
  job: DispatchJobDTO,
  kind: DispatchRequestType,
): {
  status: string;
  dispatch_job_id: string;
  dispatch_task_id: string | null;
  dispatch_task_status: string | null;
  dispatch_status_synced_at: string;
  dispatch_last_payload: Record<string, unknown>;
} {
  const taskStatus = job.task?.status ?? job.status ?? null;

  return {
    status: flashStatusForEngine(taskStatus, kind),
    dispatch_job_id: job.jobId,
    dispatch_task_id: job.task?.id ?? null,
    dispatch_task_status: taskStatus,
    dispatch_status_synced_at: new Date().toISOString(),
    dispatch_last_payload: job as unknown as Record<string, unknown>,
  };
}
