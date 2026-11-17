"use client";

import { Icon, type IconName } from "@/components/flash/Icon";
import { cn } from "@/lib/utils";

export type PaymentMethodId = "momo" | "card" | "cash";

interface Method {
  id: PaymentMethodId;
  label: string;
  detail: string;
  icon: IconName;
}

export const paymentMethods: Method[] = [
  {
    id: "momo",
    label: "Mobile Money",
    detail: "MTN MoMo, Telecel Cash, AirtelTigo Money",
    icon: "phone",
  },
  {
    id: "card",
    label: "Card",
    detail: "Visa, Mastercard",
    icon: "banknote",
  },
  {
    id: "cash",
    label: "Cash on delivery",
    detail: "Pay the rider when the order arrives",
    icon: "wallet",
  },
];

/**
 * The payment picker.
 *
 * Mobile money comes first because that is how this market pays. The methods
 * are the product's choices, not a payment provider's — the connector lands
 * with the backend, and the note below says so rather than pretending.
 */
export function PaymentMethods({
  value,
  onChange,
  allowCash = true,
}: {
  value: PaymentMethodId;
  onChange: (value: PaymentMethodId) => void;
  allowCash?: boolean;
}) {
  const methods = allowCash
    ? paymentMethods
    : paymentMethods.filter((method) => method.id !== "cash");

  return (
    <fieldset>
      <legend className="text-[15px] font-bold tracking-[-0.01em] text-ink">How are you paying?</legend>

      <div className="mt-2.5 space-y-2">
        {methods.map((method) => {
          const selected = method.id === value;

          return (
            <label
              key={method.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-[14px] border p-3 transition",
                selected ? "border-brand/45 bg-brand-soft/50" : "border-line/90 bg-surface",
              )}
            >
              <input
                type="radio"
                name="payment-method"
                value={method.id}
                checked={selected}
                onChange={() => onChange(method.id)}
                className="sr-only"
              />
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-[10px]",
                  selected ? "bg-brand-solid text-white" : "bg-surface-2 text-muted",
                )}
                aria-hidden="true"
              >
                <Icon name={method.icon} size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-ink">{method.label}</span>
                <span className="mt-0.5 block truncate text-[12px] text-muted">{method.detail}</span>
              </span>
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                  selected ? "border-brand" : "border-line-strong",
                )}
                aria-hidden="true"
              >
                {selected ? <span className="h-2 w-2 rounded-full bg-brand" /> : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * The honest note under the payment methods: no payment provider is connected
 * in this interface pass, and the UI says so instead of faking a receipt.
 */
export function PaymentNote() {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-[12px] bg-surface-2/70 px-3 py-2.5 text-[12px] leading-snug text-muted">
      <Icon name="info" size={13} className="mt-0.5 shrink-0" />
      No payment provider is connected in this interface pass. Confirming here creates a demo
      booking only.
    </p>
  );
}
