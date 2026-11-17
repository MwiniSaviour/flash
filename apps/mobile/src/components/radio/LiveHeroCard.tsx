import { cn } from "~/lib/cn";
import { Icon } from "~/components/ui/Icon";
import { LivePill } from "~/components/ui/primitives";
import { Waveform } from "~/components/ui/Waveform";
import { usePlayer } from "~/content/PlayerProvider";
import { mediaUrl } from "~/lib/api";
import type { Station } from "~/lib/types";

/**
 * The hero of the Home tab: full-bleed station artwork under a two-way scrim,
 * LIVE marker, station name, tagline and format line, with the big orange play
 * button and animated waveform that carry the whole "live radio" idea.
 */
export function LiveHeroCard({ station }: { station: Station }) {
  const { isPlaying, toggle, station: active } = usePlayer();
  const playingThis = isPlaying && active.id === station.id;

  return (
    <section
      className="relative isolate mx-5 overflow-hidden rounded-[5px] bg-media shadow-card"
      aria-label={`${station.name} live player`}
    >
      <img
        src={mediaUrl(station.artwork.src)}
        alt={station.artwork.alt}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {/* Two scrims: a top wash for the LIVE pill, a bottom wash for the type. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[74%] bg-gradient-to-t from-black/85 via-black/38 to-transparent" />

      <div className="relative flex h-[158px] flex-col justify-between p-3">
        <LivePill className="self-start" />

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 pb-0.5">
            <h2 className="truncate text-[18.5px] font-bold leading-tight tracking-[-0.02em] text-white">
              {station.name}
            </h2>
            <p className="mt-[3px] text-[12.5px] font-normal leading-snug text-white/88">
              {station.tagline}
            </p>
            <p className="mt-[2px] text-[12px] leading-snug text-white/80">
              Music <span className="px-1 text-white/55">·</span> News{" "}
              <span className="px-1 text-white/55">·</span> Culture
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggle(station)}
            aria-label={playingThis ? `Pause ${station.name}` : `Play ${station.name} live`}
            aria-pressed={playingThis}
            className={cn(
              "grid h-[48px] w-[48px] shrink-0 place-items-center rounded-full bg-brand text-white",
              "shadow-[0_10px_24px_-6px_rgb(252_83_3/0.65)] ring-[3px] ring-white/12",
              "transition active:scale-95",
            )}
          >
            <Icon name={playingThis ? "pause" : "play"} size={playingThis ? 19 : 21} className="ml-0.5" />
          </button>
        </div>

        <Waveform
          bars={30}
          height={17}
          animated
          className="text-brand"
          color={playingThis ? "#FC5303" : "#FC5303"}
        />
      </div>
    </section>
  );
}
