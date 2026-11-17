/** Date/time and money helpers shared across the app's screens. */

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/**
 * Fixtures store plain `yyyy-mm-dd`. Parsing it as a local date (instead of
 * `new Date(string)`, which reads it as UTC midnight) keeps the date badge from
 * slipping a day for users in negative-offset timezones.
 */
function parseDate(iso: string): Date {
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

/** "6:00 PM – 10:00 PM" with an en dash, matching the mock's time line. */
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

/** Whole cedis, GHC-prefixed — the design never shows decimals. */
export function cedis(amount: number) {
  return `GHC${amount}`;
}

/** "6.2 km" — one decimal below 10 km, whole numbers above, like the mock. */
export function distance(km: number) {
  return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
}

/** "12 min ago" style stamp for the newsroom screens. */
export function timeAgo(iso: string, now = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.max(1, Math.round((now.getTime() - then) / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
