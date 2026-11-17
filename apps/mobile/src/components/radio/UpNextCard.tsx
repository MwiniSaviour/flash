import { PulseBars } from "~/components/ui/PulseLogo";
import { mediaUrl } from "~/lib/api";
import { clock } from "~/lib/format";
import { airingDay, type UpcomingProgramme } from "~/lib/schedule";
import type { TileArt } from "~/lib/tiles";

/**
 * One tile in the Home "Up Next" rail: the tower's tile art (see lib/tiles), then
 * the three lines the design asks for — programme name, start time, presenter.
 */
export function UpNextCard({
  programme,
  artwork,
  onSelect,
  now = new Date(),
}: {
  programme: UpcomingProgramme;
  /** Tile art for this position in the rail. */
  artwork: TileArt;
  onSelect: () => void;
  now?: Date;
}) {
  const { show, slot, startsAt } = programme;
  const presenter = show.hosts[0]?.name;
  const day = airingDay(startsAt, now);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="block w-full text-left transition active:scale-[0.97]"
      aria-label={`${show.name}, ${day} at ${clock(slot.start)}, presented by ${presenter ?? "the station"}`}
    >
      <span className="relative block aspect-square w-full overflow-hidden rounded-[4px] bg-media">
        {artwork.src ? (
          <img
            src={mediaUrl(artwork.src)}
            alt={artwork.alt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-[#0a0a0b]">
            <PulseBars height={26} />
          </span>
        )}
      </span>

      <span className="mt-[7px] line-clamp-2 block min-h-[26px] text-[10.5px] font-semibold leading-[1.25] tracking-[-0.015em] text-ink">
        {show.name}
      </span>
      <span className="mt-[3px] block truncate text-[10px] leading-snug text-muted">
        {day === "Today" ? clock(slot.start) : `${day} ${clock(slot.start)}`}
      </span>
      <span className="block truncate text-[10px] leading-snug text-muted">{presenter}</span>
    </button>
  );
}
