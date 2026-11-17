"use client";

import { Icon, type IconName } from "@/components/flash/Icon";
import { useBooking, type BookingKind } from "@/lib/booking";
import { cn } from "@/lib/utils";

/**
 * The two big moves.
 *
 * "Book a ride" and "Send a parcel" are the actions every service surface
 * offers, and they open the booking sheet over the screen the customer is
 * standing on — so the screen behind them never loses its place.
 */
export function BookingActions({
  items,
  className,
}: {
  items: { kind: BookingKind; label: string; icon: IconName; dropoff?: string }[];
  className?: string;
}) {
  const { open } = useBooking();

  return (
    <div className={cn("flex gap-2 px-5", className)}>
      {items.map((item) => (
        <button
          key={item.kind}
          type="button"
          onClick={() => open({ kind: item.kind, dropoff: item.dropoff })}
          className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-full bg-brand-solid text-[13.5px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover active:bg-brand-solid-pressed"
        >
          <Icon name={item.icon} size={16} />
          {item.label}
        </button>
      ))}
    </div>
  );
}
