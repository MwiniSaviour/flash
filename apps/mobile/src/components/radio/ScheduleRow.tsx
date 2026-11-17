import { Icon } from "~/components/ui/Icon";
import { LivePill } from "~/components/ui/primitives";
import { cn } from "~/lib/cn";
import { mediaUrl } from "~/lib/api";
import { clock } from "~/lib/format";
import type { ScheduledProgramme } from "~/lib/schedule";

/**
 * A row in the broadcast schedule, drawn like the "Trending Now" card: artwork
 * on the left, then the programme name, "with …" presenter line, and a clock
 * beside the time range.
 *
 * There is no play control: the live stream is one continuous feed, so a row is
 * only ever a listing. Playing a programme "on demand" is not something the app
 * can do, and a button that did nothing on most rows would be a lie. The banner
 * on the Live Radio page owns the one play action.
 */
export function ScheduleRow({ programme }: { programme: ScheduledProgramme }) {
  const { show, slot, live } = programme;

  // Lead presenter plus a count: two full names never fit beside the artwork
  // at 390px.
  const lead = show.hosts[0]?.name ?? "Prototype FM";
  const extra = show.hosts.length - 1;
  const presenter = extra > 0 ? `${lead} +${extra}` : lead;

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-[5px] border p-2",
        live ? "border-brand/35 bg-brand-soft/50" : "border-line/90 bg-surface/70",
      )}
    >
      <span className="relative block h-[68px] w-[76px] shrink-0 overflow-hidden rounded-[4px] bg-media">
        <img
          src={mediaUrl(show.image.src)}
          alt={show.image.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="block truncate text-[15px] font-semibold leading-tight tracking-[-0.015em] text-ink">
            {show.name}
          </span>
          {live ? <LivePill size="sm" className="shrink-0" /> : null}
        </span>
        <span className="mt-[3px] block truncate text-[12.5px] leading-snug text-muted">
          with {presenter}
          {extra > 0 ? (
            <span className="sr-only"> and {show.hosts.slice(1).map((h) => h.name).join(", ")}</span>
          ) : null}
        </span>
        <span className="mt-[4px] flex items-center gap-1 text-[12px] leading-snug text-muted">
          <Icon name="clock" size={12} className="shrink-0 text-muted" />
          {clock(slot.start)} – {clock(slot.end)}
        </span>
      </span>
    </div>
  );
}
