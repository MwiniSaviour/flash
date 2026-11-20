"use client";

/**
 * Paystack's inline checkout popup.
 *
 * The page receives only public data from the server: an access code, the
 * amount and the reference. The browser never holds a secret key. After the
 * popup closes we poll our verify endpoint, which re-checks Paystack itself
 * before marking anything paid.
 */

const INLINE_SCRIPT = "https://js.paystack.co/v1/inline.js";

type PaystackPopType = {
  setup: (options: {
    key: string;
    email: string;
    amount: number;
    access_code: string;
    ref: string;
    currency: string;
    channels: string[];
    callback: () => void;
    onClose: () => void;
  }) => { openIframe: () => void };
};

declare global {
  interface Window {
    PaystackPop?: PaystackPopType;
  }
}

function loadInline(): Promise<PaystackPopType | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = INLINE_SCRIPT;
    script.async = true;
    script.onload = () => resolve(window.PaystackPop ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

export type CheckoutOptions = {
  accessCode: string;
  email: string;
  amountPesewas: number;
  reference: string;
  onSuccess: () => void;
  onClose?: () => void;
};

/** Opens the Paystack popup. Returns false when the popup cannot start. */
export async function openPaystackCheckout(options: CheckoutOptions): Promise<boolean> {
  const [pop, keyResponse] = await Promise.all([
    loadInline(),
    fetch("/api/payments/public-key").then((response) => response.json().catch(() => ({}))),
  ]);

  const key = keyResponse?.key;
  if (!pop || !key) return false;

  const handler = pop.setup({
    key,
    email: options.email,
    amount: options.amountPesewas,
    access_code: options.accessCode,
    ref: options.reference,
    currency: "GHS",
    channels: ["mobile_money", "card"],
    callback: () => {
      void pollPayment(options.reference).then((paid) => {
        if (paid) options.onSuccess();
        else options.onClose?.();
      });
    },
    onClose: () => options.onClose?.(),
  });

  handler.openIframe();
  return true;
}

/** Opens the Paystack popup, with hosted redirect as a fallback. */
export async function payWithIntent(
  intent: {
    accessCode: string | null;
    checkoutUrl: string | null;
    amountPesewas: number;
    reference: string;
    email: string;
  },
  onSuccess: () => void,
  onClose?: () => void,
): Promise<void> {
  if (intent.accessCode) {
    const opened = await openPaystackCheckout({
      accessCode: intent.accessCode,
      email: intent.email,
      amountPesewas: intent.amountPesewas,
      reference: intent.reference,
      onSuccess,
      onClose,
    });
    if (opened) return;
  }

  if (intent.checkoutUrl) {
    window.location.href = intent.checkoutUrl;
    return;
  }

  onClose?.();
}

/** Polls our verification endpoint for a few seconds after the popup closes. */
async function pollPayment(reference: string): Promise<boolean> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      const response = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
      const body = await response.json().catch(() => ({}));
      if (body.status === "success") return true;
      if (body.status === "amount-mismatch") return false;
    } catch {
      // Keep polling: the network may be briefly unavailable.
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return false;
}
