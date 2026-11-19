/**
 * The shared dispatch engine's wire contract.
 *
 * These are the bytes Flash sends to and reads from the ecommerce repo's
 * `/v1/jobs` endpoints. The engine owns assignment and task state; Flash only
 * keeps a snapshot of the ids and the status it last saw. Nothing here executes
 * on the client — client.ts is server-only, and this file holds just the types.
 */

export type DispatchRequestType = "ride" | "parcel";
export type DispatchRideClass = "economy" | "comfort" | "suv";
export type DispatchParcelTier = "small" | "medium" | "large";
export type DispatchPaymentMethod = "pod" | "momo" | "card";

/** The engine's task states, including the scheduling states. */
export type DispatchTaskState =
  | "unassigned"
  | "offered"
  | "accepted"
  | "picked-up"
  | "en-route"
  | "delivered"
  | "failed"
  | "returned"
  | "scheduled"
  | "due";

export type DispatchLocation = {
  name: string;
  address: string;
  area?: string;
  region: string;
  lat: number;
  lng: number;
  ghanaPost?: string;
};

export type DispatchContact = {
  name: string;
  phone: string;
  email?: string;
};

export type CreateDispatchJobInput = {
  idempotencyKey: string;
  deviceId: string;
  requestType: DispatchRequestType;
  contact: DispatchContact;
  pickup: DispatchLocation;
  dropoff: DispatchLocation;
  rideClass?: DispatchRideClass;
  parcelTier?: DispatchParcelTier;
  note?: string;
  /** ISO instant; omitted for an immediate job. */
  scheduledFor?: string;
  paymentMethod: DispatchPaymentMethod;
};

export type DispatchPayment = {
  method: DispatchPaymentMethod;
  reference: string;
  status: string;
  checkoutUrl?: string | null;
};

/** The engine's assigned driver, when it has one. */
export type DispatchDriver = {
  id?: string;
  name: string;
  phone?: string;
  photoSrc?: string;
  photoAlt?: string;
  vehicle?: string;
  plate?: string;
  rating?: number;
};

export type DispatchTask = {
  id?: string;
  status: DispatchTaskState | string;
  assignmentStatus?: string;
  pickupCode?: string;
  dropoffCode?: string;
  history?: { status: string; at: string }[];
  earnings?: Record<string, unknown>;
  payment?: DispatchPayment;
  driver?: DispatchDriver | null;
};

/** The response shared by POST /v1/jobs and GET /v1/jobs/:id. */
export type DispatchJobDTO = {
  jobId: string;
  status: DispatchTaskState | string;
  requestType: DispatchRequestType;
  fare?: number;
  currency?: string;
  etaMinutes?: number;
  pickup: DispatchLocation;
  dropoff: DispatchLocation;
  task?: DispatchTask | null;
  /** Some engine versions put the assignment on the job rather than the task. */
  driver?: DispatchDriver | null;
  payment?: DispatchPayment | null;
  guest?: unknown;
};

/** Flash's ride products map onto the engine's three classes. */
export function engineRideClass(flashClass: string): DispatchRideClass {
  if (flashClass === "flash-comfort") return "comfort";
  if (flashClass === "flash-xl") return "suv";
  return "economy";
}

/** The states in which a job no longer needs polling. */
export const DISPATCH_TERMINAL_STATES = new Set([
  "delivered",
  "completed",
  "failed",
  "returned",
  "cancelled",
]);
