import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Icon } from "~/components/ui/Icon";
import { BackButton } from "~/components/layout/BackButton";
import { DateBadge } from "~/components/ui/primitives";
import { useContent } from "~/content/ContentProvider";
import { useFavorites } from "~/content/FavoritesProvider";
import { cn } from "~/lib/cn";
import { cedis, clock, dateBadge, distance } from "~/lib/format";
import { mediaUrl } from "~/lib/api";

/**
 * Event detail: full-bleed artwork with the date chip and title over it, the
 * about copy and amenity pills, then the ticket tiers with quantity steppers and
 * the Buy Tickets action.
 *
 * Buying writes a confirmed ticket into the wallet (see ContentProvider), which
 * is what the My Tickets tab then renders — the flow is real, not a mock image.
 */
export function EventDetailScreen() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { getEvent, addTickets } = useContent();
  const event = getEvent(slug ?? "");

  // Every tier starts at one seat, exactly as drawn in the design; the stepper
  // can take it to zero and the Buy action ignores empty tiers.
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries((getEvent(slug ?? "")?.tiers ?? []).map((tier) => [tier.id, 1])),
  );
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = event ? isFavorite("event", event.slug) : false;

  // Running total, surfaced in the confirmation line after a purchase.
  const total = useMemo(() => {
    if (!event) return 0;
    return event.tiers.reduce((sum, tier) => sum + (quantities[tier.id] ?? 0) * tier.price, 0);
  }, [event, quantities]);


  if (!event) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-[15px] font-semibold text-ink">This event is no longer listed.</p>
        <button
          type="button"
          onClick={() => navigate("/explore")}
          className="rounded-full bg-brand px-5 py-2.5 text-[13.5px] font-semibold text-white"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const badge = dateBadge(event.date);

  const step = (tierId: string, delta: number) =>
    setQuantities((current) => {
      const next = Math.max(0, Math.min(8, (current[tierId] ?? 0) + delta));
      return { ...current, [tierId]: next };
    });

  const buy = () => {
    if (!event) return;
    const chosen = event.tiers.filter((tier) => (quantities[tier.id] ?? 1) > 0);
    if (chosen.length === 0) {
      // Default to one general-admission seat so the primary action always works.
      const fallback = event.tiers[0];
      const ticket = addTickets({ event, tier: fallback, quantity: 1 });
      setConfirmation(
        `${ticket.quantity} × ${ticket.tierName} confirmed · ${cedis(ticket.quantity * fallback.price)} · ${ticket.reference}`,
      );
      return;
    }
    chosen.forEach((tier) => {
      const ticket = addTickets({ event, tier, quantity: quantities[tier.id] ?? 1 });
      setConfirmation(
        `${ticket.quantity} × ${ticket.tierName} confirmed · ${cedis(ticket.quantity * tier.price)} · ${ticket.reference}`,
      );
    });
  };

  return (
    <div className="relative pb-6">
      <div className="relative">
        <div className="relative h-[252px] w-full overflow-hidden bg-media">
          <img
            src={mediaUrl(event.image.src)}
            alt={event.image.alt}
            className="h-full w-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/85" />
        </div>

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-1">
          <BackButton onClick={() => navigate(-1)} />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full text-white transition active:scale-95"
              aria-label="Share this event"
              onClick={() => {
                const shareData = { title: event.title, text: event.subtitle, url: window.location.href };
                if (navigator.share) void navigator.share(shareData).catch(() => undefined);
              }}
            >
              <Icon name="share" size={22} />
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite("event", event.slug)}
              aria-label={saved ? "Remove from favorites" : "Save this event"}
              aria-pressed={saved}
              className="grid h-9 w-9 place-items-center rounded-full text-white transition active:scale-95"
            >
              <Icon name="heart" size={23} className={saved ? "text-brand" : undefined} filled={saved} />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-start gap-2.5 px-5 pb-3.5">
          <DateBadge {...badge} size="lg" className="mt-0.5" />
          <div className="min-w-0 flex-1 pb-0.5">
            <h1 className="text-[21px] font-bold leading-[1.12] tracking-[-0.025em] text-white">
              {event.title}
            </h1>
            <p className="mt-1 text-[12px] leading-snug text-white/85">{event.subtitle}</p>
            <p className="mt-1.5 flex items-center gap-x-[5px] whitespace-nowrap text-[10.5px] leading-[1.4] text-white/85">
              <Icon name="map-pin" size={11} className="shrink-0 text-white/70" />
              <span className="truncate">
                {event.venue}, {event.city}
              </span>
              <span className="h-[2.5px] w-[2.5px] shrink-0 rounded-full bg-white/55" />
              <span className="shrink-0">{distance(event.distanceKm)}</span>
              <span className="h-[2.5px] w-[2.5px] shrink-0 rounded-full bg-white/55" />
              <span className="shrink-0">
                {clock(event.startTime)} – {clock(event.endTime)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <section className="mt-4 px-5">
        <h2 className="text-[17.5px] font-bold tracking-[-0.02em] text-ink">About This Event</h2>
        <p className="mt-1.5 text-[13px] leading-[1.5] text-ink-soft/85">{event.description}</p>

        <ul className="mt-3 flex flex-nowrap gap-1.5">
          {event.amenities.map((amenity) => (
            <li
              key={amenity.label}
              className="flex shrink-0 items-center gap-1.5 rounded-[4px] bg-surface-2 px-2.5 py-[9px] text-[11.5px] font-medium text-[#333a45]"
            >
              <Icon
                name={amenity.icon === "drink" ? "drink" : amenity.icon === "heart" ? "heart" : amenity.icon === "star" ? "sparkle" : "music"}
                size={14}
                className="shrink-0 text-[#2f3742]"
              />
              {amenity.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 px-5">
        <h2 className="text-[17.5px] font-bold tracking-[-0.02em] text-ink">Ticket Options</h2>

        <ul className="mt-2.5 space-y-2">
          {event.tiers.map((tier) => {
            const quantity = quantities[tier.id] ?? 1;
            return (
              <li
                key={tier.id}
                className="rounded-[4px] border border-line/90 bg-surface/75 p-3 shadow-[0_1px_2px_rgb(23_26_31/0.03)]"
              >
                {/* The mock sets the price and the quantity stepper in one right-hand
                    column, with the tier name and its perks holding the left column. */}
                <div className="flex items-start gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[4px] bg-brand-soft text-brand">
                    <Icon name={tier.icon === "crown" ? "crown" : "gift"} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold leading-snug tracking-[-0.015em] text-ink">
                      {tier.name}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-[1.45] text-muted">{tier.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-[13.5px] font-bold leading-snug text-ink">{cedis(tier.price)}</p>
                    <Stepper
                      value={quantity}
                      label={tier.name}
                      onDecrement={() => step(tier.id, -1)}
                      onIncrement={() => step(tier.id, 1)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={buy}
          className={cn(
            "mt-4 flex h-[46px] w-full items-center justify-center gap-2 rounded-[4px] bg-brand text-[14.5px] font-semibold text-white",
            "shadow-[0_14px_28px_-14px_rgb(252_83_3/0.85)] transition active:scale-[0.99] active:bg-brand-pressed",
          )}
        >
          Buy Tickets
          <Icon name="arrow-right" size={17} />
        </button>

      </section>

      {confirmation ? (
        <div
          role="status"
          className="animate-rise mx-5 mt-4 flex items-start gap-2.5 rounded-[5px] bg-success-soft px-3.5 py-3"
        >
          <Icon name="check-circle" size={17} className="mt-px shrink-0 text-success" />
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold leading-snug text-success">{confirmation}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-success/80">
              Basket total {cedis(total)} · demo checkout, no payment taken
            </p>
            <button
              type="button"
              onClick={() => navigate("/tickets")}
              className="mt-1 text-[12px] font-semibold text-success underline underline-offset-2"
            >
              View in My Tickets
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stepper({
  value,
  label,
  onIncrement,
  onDecrement,
}: {
  value: number;
  label: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="flex h-[32px] items-center gap-1 rounded-[5px] border border-line bg-paper px-1">
      <button
        type="button"
        onClick={onDecrement}
        disabled={value === 0}
        aria-label={`Remove one ${label}`}
        className="grid h-7 w-7 place-items-center rounded-md text-ink transition disabled:opacity-35 active:bg-surface-2"
      >
        <Icon name="minus" size={14} />
      </button>
      <span
        aria-live="polite"
        className="w-5 text-center text-[12.5px] font-semibold tabular-nums text-ink"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Add one ${label}`}
        className="grid h-7 w-7 place-items-center rounded-md text-ink transition active:bg-surface-2"
      >
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}
