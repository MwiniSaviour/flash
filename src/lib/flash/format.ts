/** Date, time and money helpers shared across ScalDive's screens. */

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/**
 * Fixtures store plain `yyyy-mm-dd`. Parsing it as a local date (instead of
 * `new Date(string)`, which reads it as UTC midnight) keeps the date badge from
 * slipping a day for users in negative-offset timezones.
 */
export function parseDate(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function dateBadge(iso: string) {
  const date = parseDate(iso);
  return {
    weekday: WEEKDAYS[date.getDay()],
    day: String(date.getDate()).padStart(2, "0"),
    month: MONTHS[date.getMonth()],
  };
}

/** "Fri 20 Nov" — the short form used beside a date badge. */
export function dayMonth(iso: string): string {
  const date = parseDate(iso);
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  return `${weekday} ${date.getDate()} ${month}`;
}

/** "6:00 PM – 10:00 PM" with an en dash. */
export function timeRange(start: string, end: string) {
  return `${clock(start)} – ${clock(end)}`;
}

export function clock(value: string) {
  const [rawHour, rawMinute] = value.split(":").map(Number);
  const hour = rawHour % 24;
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  const minute = String(rawMinute ?? 0).padStart(2, "0");
  return `${display}:${minute} ${suffix}`;
}

/** Whole cedis, GHC-prefixed — ScalDive never shows decimals. */
export function cedis(amount: number) {
  return `GHC${amount}`;
}

/** Free events read "Free" rather than GHC0. */
export function priceLabel(amount: number) {
  return amount <= 0 ? "Free" : cedis(amount);
}

/** "6.2 km" — one decimal below 10 km, whole numbers above. */
export function distance(km: number) {
  return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
}

/** "25–35 min" style window, or "18 min" when the range is a single value. */
export function minutes(minutes: number) {
  return `${minutes} min`;
}

/**
 * "Today", "Tomorrow" or "Sat 21 Nov" relative to the demo clock.
 * The demo is anchored so the fixtures never drift between server and client.
 */
export function relativeDay(iso: string, today = DEMO_TODAY): string {
  const target = parseDate(iso).getTime();
  const base = parseDate(today).getTime();
  const days = Math.round((target - base) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return parseDate(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** The demo clock. Fixtures are pinned to it so every render agrees. */
export const DEMO_TODAY = "2026-11-15";

/** "in 3 days" / "2 hours ago" style stamps for booking timelines. */
export function relativeTime(iso: string, today = DEMO_TODAY): string {
  const then = new Date(iso).getTime();
  const now = parseDate(today).getTime() + 12 * 3_600_000;
  const minutes = Math.round((now - then) / 60_000);
  if (Math.abs(minutes) < 60) {
    return minutes <= 0 ? "now" : `in ${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return hours <= 0 ? `${Math.abs(hours)} hr ago` : `in ${hours} hr`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return days <= 0 ? `${Math.abs(days)} days ago` : `in ${days} days`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Orders and rides count down: "12 min" / "Arriving". */
export function countdown(etaMinutes: number) {
  return etaMinutes <= 0 ? "Arriving" : `${etaMinutes} min`;
}
