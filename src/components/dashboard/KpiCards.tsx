import { Icon, type IconName } from "@/components/flash/Icon";
import { cn } from "@/lib/utils";

export type KpiCard = {
  label: string;
  value: string;
  icon: IconName;
  tone?: "brand" | "success" | "warning" | "neutral";
  note?: string;
  /** A real comparison, shown as an up/down delta in the card corner. */
  delta?: { value: string; direction: "up" | "down" };
};

const TONES: Record<NonNullable<KpiCard["tone"]>, string> = {
  brand: "bg-brand-soft text-brand-ink",
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-surface-2 text-icon-idle",
};

/**
 * The console's key figures.
 *
 * The card anatomy follows the admin reference — icon tile, large number,
 * label — in ScalDive's own paper/surface tokens. There is no trend arrow unless
 * a real comparison exists; a note fills that corner with a fact instead.
 */
export function KpiCards({ cards }: { cards: KpiCard[] }) {
  return (
    <section
      aria-label="Key figures"
      className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card) => (
        <div key={card.label} className="rounded-[16px] border border-line/90 bg-surface p-4">
          <span
            className={cn(
              "grid h-9 w-9 place-items-center rounded-[11px]",
              TONES[card.tone ?? "neutral"],
            )}
          >
            <Icon name={card.icon} size={18} />
          </span>

          <p className="mt-4 text-[26px] font-bold leading-none tracking-[-0.03em] text-ink">
            {card.value}
          </p>

          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-[12.5px] font-medium text-muted">{card.label}</p>
            {card.delta ? (
              <p
                className={`shrink-0 text-[11px] font-bold ${
                  card.delta.direction === "up" ? "text-success-ink" : "text-danger-ink"
                }`}
              >
                {card.delta.direction === "up" ? "↑" : "↓"} {card.delta.value}
              </p>
            ) : card.note ? (
              <p className="shrink-0 text-[11px] font-semibold text-muted-soft">{card.note}</p>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  );
}
