"use client";

import { BookingActions } from "@/components/booking/BookingActions";
import { Icon } from "@/components/flash/Icon";
import { SectionHeading } from "@/components/flash/ui";
import { GreetingHeader } from "@/components/track/TrackingChrome";
import { parcelTypes } from "@/lib/flash/data/parcels";
import type { FlashUser } from "@/lib/flash/types";

/**
 * Parcels.
 *
 * ScalDive sends parcels as well as moving people. The request itself — where it
 * goes, who receives it, what is inside — happens in the sheet the button
 * opens, so this page is the service's front door rather than its form.
 */
export function ParcelScreen({ user }: { user: FlashUser }) {
  return (
    <div className="pb-5">
      <h1 className="sr-only">Send a parcel across Accra</h1>

      <GreetingHeader user={user} />

      <div className="mt-1">
        <BookingActions
          items={[
            { kind: "parcel", label: "Send a parcel", icon: "package" },
            { kind: "ride", label: "Book a ride", icon: "ride" },
          ]}
        />
      </div>

      <section className="mt-6 px-5">
        <SectionHeading title="Send a parcel" />

        <div className="mt-3 rounded-[16px] border border-line/90 bg-surface p-4">
          <p className="text-[13.5px] leading-relaxed text-muted">
            A courier collects it where you are, and hands it to the person you name — tracked the
            whole way, in one Accra trip.
          </p>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {parcelTypes.map((item) => (
              <li
                key={item.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-muted"
              >
                <Icon name={item.icon} size={13} className="text-muted-soft" />
                {item.name}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-[12.5px] text-muted-soft">
            The price depends on the distance and how many parcels you send - each one is charged on
            its own.
          </p>
        </div>
      </section>
    </div>
  );
}
