import { Icon } from "@/components/flash/Icon";
import { SectionHeading } from "@/components/flash/ui";
import { RouteMap } from "@/components/track/RouteMap";
import { CourierBar, RouteEndpoints } from "@/components/track/TrackingChrome";
import type { Delivery } from "@/lib/flash/data/tracking";

/**
 * The live tracking block for one booked service.
 *
 * It lives on that booking's own page so a customer tracking a ride sees the
 * ride's map, endpoints, rider and progress - never somebody else's journey.
 */
export function DeliveryTracking({ delivery }: { delivery: Delivery }) {
  return (
    <section className="mt-6">
      <SectionHeading title="On the map" />

      <RouteMap
        fromLabel={delivery.from}
        toLabel={delivery.to}
        fromPlace={delivery.fromPlace}
        toPlace={delivery.toPlace}
        progress={delivery.progress}
        className="mt-3 h-[210px]"
      />

      <div className="mt-2.5">
        <RouteEndpoints delivery={delivery} />
      </div>

      <div className="mt-2.5">
        <CourierBar delivery={delivery} />
      </div>

      <ol className="mt-4 space-y-2.5">
        {delivery.steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2.5">
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                step.done
                  ? "bg-brand-solid text-white"
                  : step.current
                    ? "bg-brand-soft text-brand-ink"
                    : "bg-surface-2 text-muted-soft"
              }`}
              aria-hidden="true"
            >
              {step.done ? <Icon name="check" size={11} /> : null}
            </span>
            <span className={step.done ? "text-[13.5px] text-ink" : "text-[13.5px] text-muted"}>
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-4 font-mono text-[11px] tracking-[0.06em] text-muted-soft">
        Reference {delivery.reference}
      </p>
    </section>
  );
}
