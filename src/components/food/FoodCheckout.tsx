"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { SignInGate } from "@/components/auth/SignInGate";
import { Icon } from "@/components/flash/Icon";
import { PaymentMethods, PaymentNote, type PaymentMethodId } from "@/components/flash/PaymentMethods";
import { SegmentedControl } from "@/components/flash/SegmentedControl";
import { EmptyState, Price } from "@/components/flash/ui";
import { useCart } from "@/lib/cart";
import { placeOrder } from "@/lib/flash/actions";
import { payWithIntent } from "@/lib/payments/inline";
import { cedis } from "@/lib/flash/format";
import { deliveryQuote, type TransportRates } from "@/lib/flash/pricing";
import type { Fulfilment } from "@/lib/flash/types";

/**
 * Food checkout: what is in the bag, how it gets there and how it is paid for.
 *
 * Placing the order produces a reference and an arrival time — the same
 * commitment a ticket or a ride makes, so it lands in Bookings the same way.
 * The customer can have it delivered, or collect it from the kitchen and eat
 * there; collecting costs nothing because nobody rides anywhere.
 */
export function FoodCheckout({
  businessAccount = false,
  rates,
}: {
  businessAccount?: boolean;
  rates: TransportRates;
}) {
  const cart = useCart();
  const [method, setMethod] = useState<PaymentMethodId>("momo");
  const [address, setAddress] = useState("");
  const [fulfilment, setFulfilment] = useState<Fulfilment>("delivery");
  const [placed, setPlaced] = useState<{
    reference: string;
    etaMinutes: number;
    total: number;
    demo: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const deliveryFee = cart.restaurant ? deliveryQuote(cart.restaurant, fulfilment, rates) : 0;
  const total = cart.subtotal - cart.discount + deliveryFee;

  function place() {
    setError(null);

    startTransition(async () => {
      const result = await placeOrder({
        restaurantId: cart.restaurantId ?? "",
        fulfilment,
        address: fulfilment === "delivery" ? address : "",
        paymentMethod: method === "cash" ? "cash" : "online",
        lines: cart.lines
          .filter((line) => line.kind !== "ticket" && line.menuItemId)
          .map((line) => ({
          menuItemId: line.menuItemId!,
          size: line.size,
          toppings: line.toppings,
          quantity: line.quantity,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.data.checkout) {
        await payWithIntent(result.data.checkout, () => {
          setPlaced({
          reference: result.data.reference,
          etaMinutes: result.data.etaMinutes,
          total: result.data.total,
          demo: result.data.demo,
        });
        });
        return;
      }

      setPlaced({
          reference: result.data.reference,
          etaMinutes: result.data.etaMinutes,
          total: result.data.total,
          demo: result.data.demo,
        });

      setPlaced({
        reference: result.data.reference,
        etaMinutes: result.data.etaMinutes,
        total: result.data.total,
        demo: result.data.demo,
      });
    });
  }

  if (placed) {
    return (
      <div className="px-5 pb-6 pt-6">
        <div className="rounded-[20px] border border-line/90 bg-surface p-5 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success-ink">
            <Icon name="check" size={28} />
          </span>
          <h1 className="mt-4 text-[22px] font-bold tracking-[-0.02em] text-ink">Order placed</h1>
          <p className="mx-auto mt-1.5 max-w-[34ch] text-[13.5px] leading-relaxed text-muted">
            {cart.restaurantName ?? "The kitchen"} is preparing {cart.count}{" "}
            {cart.count === 1 ? "item" : "items"}. Track it with the reference below.
          </p>

          <div className="mt-4 rounded-[14px] bg-surface-2/70 px-4 py-3">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              Order reference
            </p>
            <p className="mt-1 font-mono text-[18px] font-bold tracking-[0.06em] text-ink">
              {placed.reference}
            </p>
          </div>

          <p className="mt-3 text-[13px] font-semibold text-brand-ink">
            {cedis(placed.total)} ·{" "}
            {fulfilment === "delivery"
              ? `Arriving in ${placed.etaMinutes} min`
              : "Ready to collect"}
          </p>

          {placed.demo ? (
            <p className="mt-1.5 text-[12px] text-muted-soft">
              </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-2">
            <Link
              href="/bookings"
              className="flex h-[48px] items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover"
            >
              Track the order
              <Icon name="arrow-right" size={16} />
            </Link>
            <button
              type="button"
              onClick={() => {
                cart.clear();
                setPlaced(null);
              }}
              className="flex h-[46px] items-center justify-center rounded-[12px] border border-line bg-surface text-[14px] font-semibold text-ink"
            >
              Back to food
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="px-5 pt-6">
        <EmptyState
          message="Your bag is empty. Pick something from a kitchen and it will show up here."
          action="Browse kitchens"
          href="/food"
        />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <header className="flex items-center gap-3 px-5 pt-3">
        <Link
          href="/food"
          aria-label="Back to food"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink transition active:scale-95"
        >
          <Icon name="chevron-left" size={19} />
        </Link>
        <h1 className="text-[20px] font-bold tracking-[-0.02em] text-ink">Your order</h1>
      </header>

      <div className="mt-4 px-5">
        <p className="text-[12.5px] text-muted">From</p>
        <p className="mt-0.5 text-[16px] font-semibold text-ink">{cart.restaurantName}</p>

        <ul className="mt-3 divide-y divide-line/70 rounded-[14px] border border-line/90 bg-surface px-3.5">
          {cart.lines.map((line) => (
            <li key={line.lineId} className="flex items-center gap-3 py-3">
              <span className="relative block h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[10px] bg-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={line.image.src} alt={line.image.alt} className="h-full w-full object-cover" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block line-clamp-2 text-[14px] font-semibold leading-tight text-ink">
                  {line.name}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-muted">
                  {[line.size, ...line.toppings].filter(Boolean).join(" · ")}
                </span>
                <span className="mt-0.5 block text-[12px] text-muted">
                  {cedis(line.price)} each
                </span>
              </span>

              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => cart.setQuantity(line.lineId, line.quantity - 1)}
                  aria-label={`One ${line.name} fewer`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-ink transition active:scale-95"
                >
                  <Icon name="minus" size={14} />
                </button>
                <span className="w-4 text-center text-[13.5px] font-semibold text-ink">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => cart.setQuantity(line.lineId, line.quantity + 1)}
                  aria-label={`One ${line.name} more`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-ink transition active:scale-95"
                >
                  <Icon name="plus" size={14} />
                </button>
              </span>

              <Price amount={line.price * line.quantity} size="sm" className="w-14 text-right" />
            </li>
          ))}
        </ul>
      </div>

      {/* How the order gets there. */}
      <div className="mt-5 px-5">
        <SegmentedControl
          ariaLabel="How you want your order"
          value={fulfilment}
          onChange={(value) => setFulfilment(value as Fulfilment)}
          options={[
            { value: "delivery", label: "Delivery" },
            { value: "pickup", label: "Pick up" },
            { value: "dine_in", label: "Dine in" },
          ]}
        />

        {fulfilment === "delivery" ? (
          <label className="mt-3 block">
            <span className="mb-1.5 block text-[15px] font-bold tracking-[-0.01em] text-ink">
              Where should it go?
            </span>
            <span className="flex h-[46px] items-center gap-2 rounded-[12px] border border-line bg-surface px-3 focus-within:border-brand/50">
              <Icon name="map-pin" size={17} className="shrink-0 text-muted" />
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                aria-label="Delivery address"
                placeholder="Where are you going?"
                className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-muted focus:outline-none"
              />
            </span>
          </label>
        ) : (
          <p className="mt-3 flex items-start gap-2 rounded-[12px] border border-line/90 bg-surface px-3.5 py-3 text-[13px] leading-snug text-muted">
            <Icon
              name={fulfilment === "pickup" ? "bag" : "bowl"}
              size={16}
              className="mt-0.5 shrink-0 text-brand"
            />
            {fulfilment === "pickup" ? "Collect" : "Eat in"} at {cart.restaurantName},{" "}
            {cart.restaurant?.neighbourhood}. No delivery charge.
          </p>
        )}
      </div>

      <div className="mt-5 px-5">
        <dl className="space-y-2 rounded-[14px] border border-line/90 bg-surface p-3.5 text-[13.5px]">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-semibold text-ink">{cedis(cart.subtotal)}</dd>
          </div>
          {cart.discount > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Dish discounts</dt>
              <dd className="font-semibold text-brand-ink">−{cedis(cart.discount)}</dd>
            </div>
          ) : null}
          {fulfilment === "delivery" ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Delivery</dt>
              <dd className="font-semibold text-ink">{cedis(deliveryFee)}</dd>
            </div>
          ) : null}
          <div className="mt-1 flex items-center justify-between gap-3 border-t border-line/80 pt-2.5">
            <dt className="font-bold text-ink">Total</dt>
            <dd className="text-[17px] font-bold tracking-[-0.02em] text-ink">{cedis(total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 px-5">
        <PaymentMethods value={method} onChange={setMethod} />
        <PaymentNote />
      </div>

      {businessAccount ? (
        <div className="mt-5 px-5">
          <div className="rounded-[16px] border border-warning/25 bg-warning-soft p-4">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 text-warning">
                <Icon name="info" size={17} />
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-ink">This is a business account</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                  A kitchen does not order from itself. Use a customer account to place an order, or
                  open your console to run the business.
                </p>
                <Link
                  href="/dashboard"
                  className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-bold text-brand-ink transition-colors hover:text-brand"
                >
                  Open your console
                  <Icon name="chevron-right" size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 px-5">
        {error ? (
          <p
            role="alert"
            className="mb-3 rounded-[12px] border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger-ink"
          >
            {error}
          </p>
        ) : null}

        <SignInGate
          label="Sign in to place an order"
          className="flex h-[50px] w-full items-center justify-center rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover"
        >
          <button
            type="button"
            onClick={place}
            disabled={isPending || businessAccount}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover active:bg-brand-solid-pressed disabled:opacity-80"
          >
            {isPending ? "Placing your order." : `Place order · ${cedis(total)}`}
            <Icon name="arrow-right" size={16} />
          </button>
        </SignInGate>
      </div>
    </div>
  );
}
