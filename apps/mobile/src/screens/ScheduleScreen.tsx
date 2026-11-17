import { BackButton } from "~/components/layout/BackButton";
import { ScheduleRow } from "~/components/radio/ScheduleRow";
import { useContent } from "~/content/ContentProvider";
import { cn } from "~/lib/cn";
import { useGoBack } from "~/lib/navigation";
import { weekSchedule } from "~/lib/schedule";

import { shows as showFixtures } from "~/data/shows";

/**
 * The full broadcast schedule, grouped by day. Same row design as Today's
 * Schedule — programme artwork leads each row, rather than the web version's
 * text-only timetable.
 */
export function ScheduleScreen() {
  const goBack = useGoBack("/live");
  const { stations } = useContent();
  const week = weekSchedule(showFixtures, new Date());

  return (
    <div className="pb-8">
      <header className="flex items-start gap-2 px-5 pt-2">
        <BackButton tone="dark" onClick={goBack} label="Back" />
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="font-display text-[24px] leading-tight font-bold tracking-[-0.014em] text-ink">
            Broadcast Schedule
          </h1>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
            Every programme on {stations[0]?.name ?? "Prototype FM"}, all week.
          </p>
        </div>
      </header>

      {week.map((day) => (
        <section key={day.day} className="mt-5 first:mt-4">
          <div className="flex items-center gap-2 px-5">
            <h2
              className={cn(
                "text-[13px] font-bold uppercase tracking-[0.12em]",
                day.today ? "text-brand" : "text-muted",
              )}
            >
              {day.label}
            </h2>
            {day.today ? (
              <span className="rounded-full bg-brand-soft px-2 py-[2px] text-[9.5px] font-bold uppercase tracking-[0.1em] text-brand">
                Today
              </span>
            ) : null}
            <span className="ml-auto text-[10.5px] font-medium text-muted-soft">
              {day.programmes.length} shows
            </span>
          </div>

          <ul className="mt-2 space-y-2 px-5">
            {day.programmes.map((programme) => (
              <li key={`${programme.show.id}-${programme.slot.start}`}>
                <ScheduleRow programme={programme} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
