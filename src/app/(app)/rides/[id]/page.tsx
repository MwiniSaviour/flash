import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingCode } from "@/components/flash/BookingCode";
import { Icon } from "@/components/flash/Icon";
import { PassActions } from "@/components/flash/PassActions";
import { Avatar, StatusBadge } from "@/components/flash/ui";
import { RouteMap } from "@/components/track/RouteMap";
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

  if (!ride) notFound();

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
            Flash · {ride.number}
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
          <RouteMap
            fromLabel={ride.from}
            toLabel={ride.to}
            fromPlace={ride.fromPlace}
            toPlace={ride.toPlace}
            progress={ride.progress}
            className="h-[180px]"
          />

          <div className="mt-3.5 flex items-center gap-3 rounded-[14px] bg-surface-2/70 p-3">
            <Avatar
              src={ride.rider.photo.src}
              alt={ride.rider.photo.alt}
              name={ride.rider.name}
              size={44}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink">{ride.rider.name}</p>
              <p className="mt-0.5 truncate text-[12px] text-muted">
                {ride.rider.vehicle} · {ride.rider.plate}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Call ${ride.rider.name}`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition active:scale-95"
            >
              <Icon name="phone" size={17} />
            </button>
          </div>

          <dl className="mt-3.5 grid grid-cols-3 gap-2 border-t border-line/80 pt-3.5 text-[13px]">
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
        <div className="mt-4">
        <PassActions reference={ride.reference} title={`Flash ride ${ride.number}`} shareLabel="Share trip" />
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
