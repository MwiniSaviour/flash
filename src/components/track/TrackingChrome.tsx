import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { RouteProgress } from "@/components/track/RouteMap";
import { Avatar, StatusBadge } from "@/components/flash/ui";
import type { Delivery } from "@/lib/flash/data/tracking";
import type { FlashUser } from "@/lib/flash/types";

/**
 * The greeting header the ride and track screens share.
 *
 * It replaces the app header on those two screens: the person is on the move,
 * so the screen opens with their name, their account and their alerts rather
 * than a brand banner.
 */
export function GreetingHeader({ user }: { user: FlashUser }) {
  const firstName = user.name.split(" ")[0];

  return (
    <header className="flex items-center gap-3 px-5 pt-4 pb-3">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-muted">Hello,</p>
        <p className="text-[20px] font-bold leading-tight tracking-[-0.02em] text-ink">
          {firstName}
        </p>
      </div>

      <button
        type="button"
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-full bg-surface text-icon-idle transition active:scale-95"
      >
        <Icon name="bell" size={19} />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand" />
      </button>

      <Link href="/profile" aria-label="Your profile" className="rounded-full active:scale-95">
        <Avatar
          src={user.avatarUrl}
          alt={`${user.name}'s profile photo`}
          name={user.name}
          size={38}
          className="ring-[2px] ring-white"
        />
      </Link>
    </header>
  );
}

const stageTone = {
  scheduled: { tone: "brand" as const, icon: "calendar" as const },
  preparing: { tone: "warning" as const, icon: "clock" as const },
  "on the way": { tone: "brand" as const, icon: "truck" as const },
  arriving: { tone: "success" as const, icon: "navigation" as const },
  delivered: { tone: "neutral" as const, icon: "check" as const },
};

/** Where a delivery's own detail and proof live. */
function detailHref(delivery: Delivery) {
  if (delivery.kind === "order") return `/orders/${delivery.id}`;
  if (delivery.kind === "ride") return `/rides/${delivery.id}`;
  return `/parcels/${delivery.id}`;
}

/**
 * One delivery in the list: its number, where it is, how far it has come and
 * what is inside it.
 *
 * The card opens the delivery's own page — the receipt, the route, the proof —
 * because that is what the customer wants when they tap it.
 */
export function DeliveryCard({ delivery }: { delivery: Delivery }) {
  const stage = stageTone[delivery.status];

  return (
    <Link
      href={detailHref(delivery)}
      className="block w-full rounded-[16px] border border-line/90 bg-surface p-3 transition hover:border-line-strong active:scale-[0.99]"
    >
      <span className="flex items-start gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-brand-soft text-brand-ink">
          <Icon name={delivery.kind === "ride" ? "ride" : "package"} size={17} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-bold tracking-[-0.01em] text-ink">
              #{delivery.number}
            </span>
            <StatusBadge tone={stage.tone} icon={stage.icon}>
              {delivery.statusLabel}
            </StatusBadge>
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-muted">{delivery.title}</span>
        </span>

        {delivery.kind === "parcel" ? (
          <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[12px] bg-brand-soft text-brand-ink">
            <Icon name="package" size={22} />
          </span>
        ) : (
          <span className="relative block h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[12px] bg-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={delivery.image.src}
              alt={delivery.image.alt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </span>
        )}
      </span>

      <RouteProgress progress={delivery.progress} className="mt-3" />

      <span className="mt-2.5 flex items-center justify-between gap-2 text-[11.5px] text-muted">
        <span className="truncate">{delivery.fromPlace}</span>
        <span className="flex shrink-0 items-center gap-1 font-semibold text-ink">
          <Icon name="timer" size={12} className="text-brand" />
          {delivery.eta}
        </span>
        <span className="truncate text-right">{delivery.toPlace}</span>
      </span>
    </Link>
  );
}

/** The number the customer reaches the rider on, in local and E.164 form. */
const RIDER_PHONE = "0552703858";
const RIDER_PHONE_E164 = `233${RIDER_PHONE.slice(1)}`;

/**
 * The courier bar under the map: who is coming, and the two ways to reach them.
 */
export function CourierBar({ delivery }: { delivery: Delivery }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-line/90 bg-surface p-3">
      <Avatar
        src={delivery.rider.photo.src}
        alt={delivery.rider.photo.alt}
        name={delivery.rider.name}
        size={42}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-ink">{delivery.rider.name}</p>
        <p className="mt-0.5 truncate text-[12px] text-muted">
          {delivery.rider.plate} · {delivery.rider.vehicle}
        </p>
      </div>

      <a
        href={`tel:+${RIDER_PHONE_E164}`}
        aria-label={`Call ${delivery.rider.name} on ${RIDER_PHONE}`}
        title={RIDER_PHONE}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink transition active:scale-95"
      >
        <Icon name="phone" size={17} />
      </a>

      <a
        href={`https://wa.me/${RIDER_PHONE_E164}?text=${encodeURIComponent(`Hello ${delivery.rider.name}, I'm your Flash customer on the ${delivery.title} trip.`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Message ${delivery.rider.name} on WhatsApp`}
        title={RIDER_PHONE}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-solid text-white shadow-brand transition active:scale-95"
      >
        <Icon name="send" size={17} />
      </a>
    </div>
  );
}

/** The sender / receiver pair under the map. */
export function RouteEndpoints({ delivery }: { delivery: Delivery }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-[14px] border border-line/90 bg-surface p-3">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">From</p>
        <p className="mt-1 truncate text-[13px] font-semibold text-ink">{delivery.from}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-muted">{delivery.fromPlace}</p>
      </div>
      <div className="rounded-[14px] border border-line/90 bg-surface p-3">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">To</p>
        <p className="mt-1 truncate text-[13px] font-semibold text-ink">{delivery.to}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-muted">{delivery.toPlace}</p>
      </div>
    </div>
  );
}

