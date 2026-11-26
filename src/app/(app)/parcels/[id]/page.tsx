import type { Metadata } from "next";
import Link from "next/link";

import { BookingCode } from "@/components/flash/BookingCode";
import { NoData } from "@/components/flash/NoData";
import { Icon } from "@/components/flash/Icon";
import { PassActions } from "@/components/flash/PassActions";
import { StatusBadge } from "@/components/flash/ui";
import { CancelDeliveryButton } from "@/components/track/CancelDeliveryButton";
import { LiveDeliveryTracking } from "@/components/track/LiveDeliveryTracking";
import { getDelivery } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Your parcel",
};

/**
 * The parcel.
 *
 * What is inside it, where it is going, who is carrying it and the code that
 * identifies it at the door. A sender needs the same proof a rider and a
 * venue need.
 */
export default async function ParcelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const delivery = await getDelivery(id);
  const parcel = delivery?.kind === "parcel" ? delivery : undefined;

  if (!parcel) {
    return (
      <div className="px-5 pb-6 pt-3">
        <NoData
          title="No parcel yet"
          message="There is no parcel at this reference. Send one and its live tracking will appear here."
          action="Send a parcel"
          href="/parcel"
        />
      </div>
    );
  }

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
        <h1 className="text-[20px] font-bold tracking-[-0.02em] text-ink">Your parcel</h1>
      </header>

      <article className="mt-4 overflow-hidden rounded-[20px] border border-line/90 bg-surface shadow-raised">
        <div className="bg-brand-solid px-4 py-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
            Tracking {parcel.number}
          </p>
          <h2 className="mt-1.5 text-[21px] font-bold leading-tight tracking-[-0.02em]">
            {parcel.parcelType}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-[13px] text-white/85">
            {parcel.statusLabel}
            <StatusBadge tone="brand" icon="truck">
              {parcel.eta}
            </StatusBadge>
          </p>
        </div>

        <div className="p-4">
          <div className="border-t border-line/80 pt-3.5">
            <div className="flex items-start gap-2.5">
              <Icon name="map-pin" size={16} className="mt-0.5 shrink-0 text-brand" />
              <div>
                <p className="text-[13.5px] font-semibold text-ink">
                  {parcel.from} → {parcel.to}
                </p>
                <p className="mt-0.5 text-[12.5px] text-muted">
                  {parcel.fromPlace} to {parcel.toPlace}
                </p>
              </div>
            </div>
          </div>

          {parcel.recipientName ? (
            <div className="mt-3.5 border-t border-line/80 pt-3.5">
              <div className="flex items-start gap-2.5">
                <Icon name="user" size={16} className="mt-0.5 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-ink">
                    For {parcel.recipientName}
                  </p>
                  {parcel.recipientPhone ? (
                    <p className="mt-0.5 text-[12.5px] text-muted">{parcel.recipientPhone}</p>
                  ) : null}
                  {parcel.parcelDetails ? (
                    <p className="mt-1 text-[12.5px] text-muted">{parcel.parcelDetails}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-4 border-t border-line/80 pt-4">
            <BookingCode
              value={parcel.reference}
              caption="Show this code when the parcel is collected"
              className="mx-auto max-w-[220px]"
            />
          </div>
        </div>
      </article>

      <LiveDeliveryTracking delivery={parcel} />

        <div className="mt-4">
        <PassActions
          reference={parcel.reference}
          title={`Parcel ${parcel.number} — ${parcel.parcelType}`}
          shareLabel="Share tracking"
        />
      </div>

      {parcel.status !== "cancelled" && parcel.status !== "delivered" ? (
        <CancelDeliveryButton id={parcel.id} kind="parcel" label="Cancel parcel" />
      ) : null}
    </div>
  );
}
