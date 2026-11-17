import { useNavigate } from "react-router-dom";

import { BackButton } from "~/components/layout/BackButton";
import { ScheduleRow } from "~/components/radio/ScheduleRow";
import { Icon } from "~/components/ui/Icon";
import { LivePill } from "~/components/ui/primitives";
import { Waveform } from "~/components/ui/Waveform";
import { useContent } from "~/content/ContentProvider";
import { usePlayer } from "~/content/PlayerProvider";
import { mediaUrl } from "~/lib/api";
import { clock } from "~/lib/format";
import { useGoBack } from "~/lib/navigation";
import { currentBroadcast, todaySchedule } from "~/lib/schedule";

import { shows as showFixtures } from "~/data/shows";

/**
 * Live Radio — the broadcast schedule.
 *
 * The banner carries whatever is on air now (or, between programmes, the next
 * broadcast) and owns the single play action for the live stream. "Today's
 * Schedule" lists the day in time order, and "View all" opens the full week.
 */
export function LiveScreen() {
  const goBack = useGoBack();
  const navigate = useNavigate();
  const { stations } = useContent();
  const { play, isPlaying, pause, station: activeStation, status } = usePlayer();

  const now = new Date();
  const onAir = currentBroadcast(showFixtures, now);
  const today = todaySchedule(showFixtures, now);
  const flagship = stations[0];
  const playingThis = Boolean(flagship) && isPlaying && activeStation.id === flagship.id;

  return (
    <div className="pb-6">
      <header className="flex items-start gap-2 px-5 pt-2">
        <BackButton tone="dark" onClick={goBack} label="Back" />
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="font-display text-[24px] leading-tight font-bold tracking-[-0.014em] text-ink">
            Live Radio
          </h1>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
            {today.length} broadcasts today on {flagship?.name ?? "Prototype FM"}.
          </p>
        </div>
      </header>

      {onAir ? (
        <section className="mt-3.5 px-5">
          <div className="relative isolate overflow-hidden rounded-[5px] bg-media p-4 shadow-card">
            {flagship ? (
              <img
                src={mediaUrl(flagship.artwork.src)}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-55"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/94 via-black/72 to-black/45" />
            <div className="relative">
              <div className="flex items-center justify-between">
                {onAir.live ? (
                  <LivePill />
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur">
                    <Icon name="clock" size={11} />
                    Up next
                  </span>
                )}
                <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/60">
                  {onAir.live ? "On air now" : "Starts soon"}
                </span>
              </div>

              <div className="mt-9 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[21px] font-bold leading-tight tracking-[-0.02em] text-white">
                    {onAir.show.name}
                  </p>
                  <p className="mt-1 truncate text-[12.5px] text-white/80">
                    {clock(onAir.slot.start)} – {clock(onAir.slot.end)} ·{" "}
                    {onAir.show.hosts.map((host) => host.name).join(" & ")}
                  </p>
                  <Waveform
                    bars={24}
                    height={16}
                    className="mt-3 text-brand"
                    color="#FC5303"
                    animated={onAir.live}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!flagship) return;
                    playingThis ? pause() : play(flagship);
                  }}
                  aria-label={
                    playingThis
                      ? `Pause ${flagship?.name ?? "the live stream"}`
                      : `Listen live to ${flagship?.name ?? "the station"}`
                  }
                  className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_10px_24px_-6px_rgb(252_83_3/0.65)] transition active:scale-95"
                >
                  <Icon name={playingThis ? "pause" : "play"} size={22} className="ml-0.5" />
                </button>
              </div>
            </div>
          </div>
          <p aria-live="polite" className="mt-2 min-h-[16px] px-1 text-[11.5px] leading-snug text-muted">
            {status}
          </p>
        </section>
      ) : null}

      <section className="mt-1">
        <div className="flex items-end justify-between gap-3 px-5 pt-2">
          <h2 className="text-[17.5px] font-bold tracking-[-0.015em] text-ink">
            Today&apos;s Schedule
          </h2>
          <button
            type="button"
            onClick={() => navigate("/live/schedule")}
            className="flex shrink-0 items-center gap-1 pb-[1px] text-[11.5px] font-semibold text-ink/75 transition active:opacity-60"
          >
            View all
            <Icon name="arrow-right" size={13} className="translate-y-[0.5px]" />
          </button>
        </div>

        <ul className="mt-2.5 space-y-2 px-5">
          {today.map((programme) => (
            <li key={`${programme.show.id}-${programme.slot.start}`}>
              <ScheduleRow programme={programme} />
            </li>
          ))}
        </ul>

        {today.length === 0 ? (
          <p className="mx-5 mt-3 rounded-2xl border border-dashed border-line-strong/70 px-4 py-6 text-center text-[12.5px] leading-relaxed text-muted">
            Nothing else is scheduled today. The full week is under View all.
          </p>
        ) : null}
      </section>
    </div>
  );
}
