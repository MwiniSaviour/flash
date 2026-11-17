import type { Show, ShowSlot } from "~/lib/types";

/**
 * "Up Next" is derived from the shared programme schedule, never hard-coded:
 * every show carries its own weekday slots, so the next broadcast for each
 * programme is the earliest slot that has not started yet.
 */

const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export interface UpcomingProgramme {
  show: Show;
  slot: ShowSlot;
  /** Concrete date-time of the next airing. */
  startsAt: Date;
}

/** Next airing of one slot, counting from `now` (today included while it lasts). */
function nextAiring(slot: ShowSlot, now: Date): Date {
  const [hours, minutes] = slot.start.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hours % 24, minutes || 0, 0, 0);

  const wanted = DAY_INDEX[slot.day] ?? 0;
  let offset = (wanted - target.getDay() + 7) % 7;
  if (offset === 0 && target.getTime() <= now.getTime()) offset = 7;
  target.setDate(target.getDate() + offset);
  return target;
}

/** The next `limit` programmes on air, soonest first. */
export function upcomingProgrammes(shows: Show[], now = new Date(), limit = 6): UpcomingProgramme[] {
  const upcoming: UpcomingProgramme[] = [];

  for (const show of shows) {
    let best: UpcomingProgramme | null = null;
    for (const slot of show.schedule) {
      const startsAt = nextAiring(slot, now);
      if (!best || startsAt.getTime() < best.startsAt.getTime()) best = { show, slot, startsAt };
    }
    if (best) upcoming.push(best);
  }

  return upcoming.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()).slice(0, limit);
}

/** Human day label for a programme slot: "Today", "Tomorrow" or the weekday. */
export function airingDay(startsAt: Date, now = new Date()): string {
  const atMidnight = (value: Date) => new Date(value).setHours(0, 0, 0, 0);
  const days = Math.round((atMidnight(startsAt) - atMidnight(now)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return startsAt.toLocaleDateString("en-GB", { weekday: "long" });
}

const DAYS: ShowSlot["day"][] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const todayName = (now: Date) => DAYS[(now.getDay() + 6) % 7];

/** Minutes since midnight, for ordering a day's slots. */
const minutesOf = (hhmm: string) => {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return (hours % 24) * 60 + (minutes || 0);
};

export interface ScheduledProgramme extends UpcomingProgramme {
  /** True when this slot is on air at `now`. */
  live: boolean;
}

/** Everything scheduled today, in time order — the "Today's schedule" list. */
export function todaySchedule(shows: Show[], now = new Date()): ScheduledProgramme[] {
  const day = todayName(now);
  const minute = now.getHours() * 60 + now.getMinutes();

  return shows
    .flatMap((show) =>
      show.schedule
        .filter((slot) => slot.day === day)
        .map((slot) => {
          const startsAt = new Date(now);
          const [hours, minutes] = slot.start.split(":").map(Number);
          startsAt.setHours(hours % 24, minutes || 0, 0, 0);
          return {
            show,
            slot,
            startsAt,
            live: minute >= minutesOf(slot.start) && minute < minutesOf(slot.end),
          };
        }),
    )
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/**
 * The broadcast on air right now. When the station is between programmes it
 * returns the next one instead of inventing a live state, flagged `live: false`.
 */
export function currentBroadcast(shows: Show[], now = new Date()): ScheduledProgramme | null {
  const today = todaySchedule(shows, now);
  const onAir = today.find((programme) => programme.live);
  if (onAir) return onAir;

  const later = today.find((programme) => programme.startsAt.getTime() > now.getTime());
  if (later) return later;

  const next = upcomingProgrammes(shows, now, 1)[0];
  return next ? { ...next, live: false } : null;
}

/** The whole week's grid, grouped by day — "View all schedule". */
export function weekSchedule(shows: Show[], now = new Date()): {
  day: ShowSlot["day"];
  label: string;
  today: boolean;
  programmes: ScheduledProgramme[];
}[] {
  const todayIdx = (now.getDay() + 6) % 7;
  // Which programme is on air today, so the week grid can mark it too.
  const liveNow = todaySchedule(shows, now).filter((programme) => programme.live);

  return DAYS.map((day, index) => {
    const programmes = shows
      .flatMap((show) =>
        show.schedule
          .filter((slot) => slot.day === day)
          .map((slot) => {
            const startsAt = new Date(now);
            const [hours, minutes] = slot.start.split(":").map(Number);
            startsAt.setHours(hours % 24, minutes || 0, 0, 0);
            const live =
              index === todayIdx &&
              liveNow.some((item) => item.show.id === show.id && item.slot.start === slot.start);
            return { show, slot, startsAt, live };
          }),
      )
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

    return {
      day,
      label: day.charAt(0).toUpperCase() + day.slice(1),
      today: index === todayIdx,
      programmes,
    };
  });
}
