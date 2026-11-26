import type { Metadata } from "next";
import Link from "next/link";

import { BookingCode } from "@/components/flash/BookingCode";
import { Icon } from "@/components/flash/Icon";
import { NoData } from "@/components/flash/NoData";
import { PassActions } from "@/components/flash/PassActions";
import { StatusBadge } from "@/components/flash/ui";
import { LiveDeliveryTracking } from "@/components/track/LiveDeliveryTracking";
import { cedis, distance } from "@/lib/flash/format";
import { getDelivery } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Your ride",
};

/**
 * The ride.
 *
 * The booking, the route, the driver and the plate — plus the code a rider
 * checks before setting off. Everything a passenger needs when the phone runs
 * out of battery in the car.
 */
export default async function RideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const delivery = await getDelivery(id);
  const ride = delivery?.kind === "ride" ? delivery : undefined;

  if (!ride) {
    return (
      <div className="px-5 pb-6 pt-3">
        <NoData
          title="No ride yet"
          message="There is no ride at this reference. Book one and its live tracking will appear here."
          action="Book a ride"
          href="/ride"
        />
      </div>
    );
  }

  const fare = ride.price ?? 0;

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
        <h1 className="text-[20px] font-bold tracking-[-0.02em] text-ink">Your ride</h1>
      </header>

      <article className="mt-4 overflow-hidden rounded-[20px] border border-line/90 bg-surface shadow-raised">
        <div className="bg-brand-solid px-4 py-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
            ScalDive · {ride.number}
          </p>
          <h2 className="mt-1.5 text-[21px] font-bold leading-tight tracking-[-0.02em]">
            {ride.title}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-[13px] text-white/85">
            {ride.statusLabel}
            <StatusBadge tone="brand" icon="navigation">
              {ride.eta}
            </StatusBadge>
          </p>
        </div>

        <div className="p-4">
          <dl className="grid grid-cols-3 gap-2 text-[13px]">
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted">Fare</dt>
              <dd className="mt-1 font-semibold text-ink">{cedis(fare)}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted">Trip</dt>
              <dd className="mt-1 font-semibold text-ink">{distance(ride.distanceKm ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted">Time</dt>
              <dd className="mt-1 font-semibold text-ink">{ride.durationMinutes ?? 0} min</dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-line/80 pt-4">
            <BookingCode
              value={ride.reference}
              caption="Show this code to your driver before you set off"
              className="mx-auto max-w-[220px]"
            />
          </div>
        </div>
      </article>

      <LiveDeliveryTracking delivery={ride} />

        <div className="mt-4">
        <PassActions reference={ride.reference} title={`ScalDive ride ${ride.number}`} shareLabel="Share trip" />
      </div>

      <button
        type="button"
        className="mt-2 h-[44px] w-full rounded-[12px] border border-line bg-surface text-[13.5px] font-semibold text-danger transition active:scale-[0.99]"
      >
        Cancel ride
      </button>

      <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
        <Icon name="info" size={13} className="mt-0.5 shrink-0" />
        Cancellations inside two minutes of pick-up are free. Later than that, the fare still
        applies.
      </p>
    </div>
  );
}
