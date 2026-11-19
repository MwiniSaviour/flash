import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingCode } from "@/components/flash/BookingCode";
import { ConfirmDeliveryButton } from "@/components/flash/ConfirmDeliveryButton";
import { Icon } from "@/components/flash/Icon";
import { PassActions } from "@/components/flash/PassActions";
import { Avatar, StatusBadge } from "@/components/flash/ui";
import { cedis } from "@/lib/flash/format";
import { getDelivery } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Your order",
};

/**
 * The order receipt.
 *
 * Everything a rider might ask for and everything the customer might need to
 * check: the items, the money, where it is going, who is bringing it, and a
 * code that identifies the order without a phone call.
 */
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const delivery = await getDelivery(id);
  const order = delivery?.kind === "order" ? delivery : undefined;

  if (!order?.receipt) notFound();

  const receipt = order.receipt;
  const awaitingConfirmation = order.status === "on the way";

  return (
    <div className="px-5 pb-6 pt-3">
      <header className="flex items-center gap-3">
        <Link
          href="/track"
          aria-label="Back to tracking"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink transition active:scale-95"
        >
          <Icon name="chevron-left" size={19} />
        </Link>
        <h1 className="text-[20px] font-bold tracking-[-0.02em] text-ink">Your order</h1>
      </header>

      <article className="mt-4 overflow-hidden rounded-[20px] border border-line/90 bg-surface shadow-raised">
        <div className="bg-brand-solid px-4 py-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
            Order #{order.number}
          </p>
          <h2 className="mt-1.5 text-[21px] font-bold leading-tight tracking-[-0.02em]">
            {order.title}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-[13px] text-white/85">
            {order.fromPlace}
            <StatusBadge tone="brand" icon="truck">
              {order.statusLabel}
            </StatusBadge>
          </p>
        </div>

        <div className="p-4">
          <ul className="space-y-2.5 border-b border-line/80 pb-3.5">
            {receipt.lines.map((line) => (
              <li key={line.name} className="flex items-baseline justify-between gap-3">
                <span className="text-[13.5px] text-ink">
                  {line.name}
                  <span className="text-muted"> × {line.quantity}</span>
                </span>
                <span className="shrink-0 text-[13.5px] font-semibold text-ink">
                  {cedis(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 pt-3.5 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold text-ink">{cedis(receipt.subtotal)}</dd>
            </div>
            {receipt.discount ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Discount</dt>
                <dd className="font-semibold text-brand-ink">−{cedis(receipt.discount)}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Delivery</dt>
              <dd className="font-semibold text-ink">{cedis(receipt.deliveryFee)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line/80 pt-2.5">
              <dt className="font-bold text-ink">Total</dt>
              <dd className="text-[17px] font-bold tracking-[-0.02em] text-ink">
                {cedis(receipt.total)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-line/80 pt-4">
            <div className="flex items-start gap-2.5">
              <Icon name="map-pin" size={16} className="mt-0.5 shrink-0 text-brand" />
              <div>
                <p className="text-[13.5px] font-semibold text-ink">{receipt.address}</p>
                <p className="mt-0.5 text-[12.5px] text-muted">
                  {order.to}, {order.toPlace}
                </p>
              </div>
            </div>
            <div className="mt-3.5 flex items-center gap-3 rounded-[14px] bg-surface-2/70 p-3">
              <Avatar
                src={order.rider.photo.src}
                alt={order.rider.photo.alt}
                name={order.rider.name}
                size={40}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink">{order.rider.name}</p>
                <p className="mt-0.5 truncate text-[12px] text-muted">
                  {order.rider.vehicle} · {order.rider.plate}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Call ${order.rider.name}`}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition active:scale-95"
              >
                <Icon name="phone" size={17} />
              </button>
            </div>
          </div>

          <div className="mt-4 border-t border-line/80 pt-4">
            <BookingCode
              value={order.reference}
              caption="Show this code to your rider on arrival"
              className="mx-auto max-w-[220px]"
            />
          </div>
        </div>
        {awaitingConfirmation ? <ConfirmDeliveryButton orderId={order.id} /> : null}

</article>
        <div className="mt-4">
        <PassActions
          reference={order.reference}
          title={`Order ${order.number} — ${order.title}`}
          shareLabel="Share order"
        />
      </div>

      <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
        <Icon name="info" size={13} className="mt-0.5 shrink-0" />
        Something wrong with the order? Call the rider from the card above and they will sort it on the way.
      </p>
    </div>
  );
}
