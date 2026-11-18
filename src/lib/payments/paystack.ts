import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getEnv } from "@/lib/env";

/**
 * Paystack, from the server only.
 *
 * Follows the pattern proven in the ecommerce app: the platform collects the
 * charge, and sellers and drivers are paid with transfers after fulfilment.
 * Amounts cross this boundary in pesewas; the caller recomputes them from the
 * stored order, never from the browser.
 */

const API_ROOT = "https://api.paystack.co";
const TIMEOUT_MS = 12_000;

export function paystackKey(): string {
  return getEnv().paystackSecretKey?.trim() ?? "";
}

export function paystackConfigured(): boolean {
  return paystackKey().startsWith("sk_");
}

/** A reference a customer can read out, unique enough for a busy day. */
export function newReference(prefix = "FLS"): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<{ ok: boolean; message: string; data: T | null }> {
  const response = await fetch(`${API_ROOT}${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${paystackKey()}`,
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });

  const body = (await response.json()) as { status?: boolean; message?: string; data?: T };

  return {
    ok: Boolean(body.status),
    message: body.message ?? (response.ok ? "ok" : `HTTP ${response.status}`),
    data: body.data ?? null,
  };
}

export type PaystackInit = {
  ok: boolean;
  message: string;
  checkoutUrl: string | null;
  reference: string;
};

/** One hosted checkout URL. No browser-side public key is needed. */
export async function initPaystackTransaction(input: {
  amountPesewas: number;
  email: string;
  reference: string;
  callbackUrl?: string;
}): Promise<PaystackInit> {
  const result = await request<{ authorization_url?: string }>("/transaction/initialize", {
    method: "POST",
    body: {
      amount: input.amountPesewas,
      email: input.email,
      currency: "GHS",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: { reference: input.reference },
    },
  });

  return {
    ok: result.ok && Boolean(result.data?.authorization_url),
    message: result.message,
    checkoutUrl: result.data?.authorization_url ?? null,
    reference: input.reference,
  };
}

export type PaystackVerification = {
  status: string;
  amountPesewas: number | null;
  reference: string | null;
};

/** Confirms a charge server-side; used by the webhook before fulfilment. */
export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerification> {
  const result = await request<{ status?: string; amount?: number; reference?: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );

  return {
    status: result.data?.status ?? "unknown",
    amountPesewas: typeof result.data?.amount === "number" ? result.data.amount : null,
    reference: result.data?.reference ?? null,
  };
}

/** HMAC-SHA512 over the raw body, compared in constant time. */
export function verifyWebhookSignature(
  raw: ArrayBuffer | Buffer,
  signature: string | undefined,
): boolean {
  const key = paystackKey();
  if (!key || !signature) return false;

  const expected = createHmac("sha512", key)
    .update(Buffer.isBuffer(raw) ? raw : Buffer.from(raw))
    .digest("hex");

  const provided = Buffer.from(signature.toLowerCase());
  const wanted = Buffer.from(expected);
  return provided.length === wanted.length && timingSafeEqual(provided, wanted);
}

export type PaystackWebhookPayload = {
  event?: string;
  data?: {
    id?: number | string;
    reference?: string;
    status?: string;
    amount?: number;
    transfer_code?: string;
  };
};

export async function listPaystackBanks(): Promise<{
  banks: { code: string; name: string }[];
  momo: { code: string; name: string }[];
}> {
  const [banks, momo] = await Promise.all([
    request<{ code: string; name: string }[]>("/bank?currency=GHS&pay_with_bank_transfer=false"),
    request<{ code: string; name: string }[]>("/bank?currency=GHS&type=mobile_money"),
  ]);

  return { banks: banks.data ?? [], momo: momo.data ?? [] };
}

export async function createTransferRecipient(input: {
  type: "nuban" | "mobile_money";
  name: string;
  accountNumber: string;
  bankCode: string;
}): Promise<{ ok: boolean; message: string; recipientCode: string | null }> {
  const result = await request<{ recipient_code?: string }>("/transferrecipient", {
    method: "POST",
    body: {
      type: input.type,
      name: input.name,
      account_number: input.accountNumber,
      bank_code: input.bankCode,
      currency: "GHS",
    },
  });

  return {
    ok: result.ok && Boolean(result.data?.recipient_code),
    message: result.message,
    recipientCode: result.data?.recipient_code ?? null,
  };
}

export async function requestTransfer(input: {
  recipient: string;
  amountPesewas: number;
  reason: string;
}): Promise<{ ok: boolean; message: string; transferCode: string | null; status: string }> {
  const result = await request<{ transfer_code?: string; status?: string }>("/transfer", {
    method: "POST",
    body: {
      recipient: input.recipient,
      amount: input.amountPesewas,
      reason: input.reason,
      currency: "GHS",
    },
  });

  return {
    ok: result.ok,
    message: result.message,
    transferCode: result.data?.transfer_code ?? null,
    status: result.data?.status ?? "pending",
  };
}

/** Refunds draw from the platform's own balance: no clawback arithmetic. */
export async function refundPaystackPayment(
  reference: string,
  amountPesewas?: number,
): Promise<{ ok: boolean; message: string }> {
  const result = await request("/refund", {
    method: "POST",
    body: {
      transaction: reference,
      ...(amountPesewas ? { amount: amountPesewas } : {}),
    },
  });

  return { ok: result.ok, message: result.message };
}
