"use client";

import { Icon } from "@/components/flash/Icon";
import { SegmentedControl } from "@/components/flash/SegmentedControl";
import { Field, SectionHeading } from "@/components/flash/ui";
import { cn } from "@/lib/utils";

export type Schedule = { mode: "now" } | { mode: "later"; date: string; time: string };

/** Today, as a date input wants it — local to the customer, not the server. */
export function todayAsInput() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** The first free window of the day, when a customer switches to scheduling. */
export function defaultSchedule(): Schedule {
  return { mode: "later", date: todayAsInput(), time: "16:00" };
}

/** A readable window, formatted the same way on the server and in the browser. */
export function scheduleLabel(schedule: Schedule): string {
  if (schedule.mode === "now") return "Now";

  const moment = new Date(`${schedule.date}T${schedule.time}:00Z`);
  if (Number.isNaN(moment.getTime())) return "Choose a pick-up date and time";

  const day = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(moment);

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(moment);

  return `${day} at ${time}`;
}

/** The ISO instant a scheduled booking stores — null when it goes now. */
export function scheduleInstant(schedule: Schedule): string | null {
  if (schedule.mode === "now") return null;

  const moment = new Date(`${schedule.date}T${schedule.time}`);
  return Number.isNaN(moment.getTime()) ? null : moment.toISOString();
}

/**
 * When should it go?
 *
 * "Now" is the default; "Schedule" opens a real calendar and a time field so
 * the customer chooses the pick-up window instead of reading a fixed line of
 * copy. The chosen window is shown back to them under the fields.
 */
export function SchedulePicker({
  value,
  onChange,
  className,
}: {
  value: Schedule;
  onChange: (value: Schedule) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <SectionHeading title="When should it go?" />

      <SegmentedControl
        className="mt-3"
        ariaLabel="When to send"
        value={value.mode}
        onChange={(mode) => onChange(mode === "later" ? defaultSchedule() : { mode: "now" })}
        options={[
          { value: "now", label: "Now" },
          { value: "later", label: "Schedule" },
        ]}
      />

      {value.mode === "later" ? (
        <div className="mt-3 rounded-[16px] border border-line/90 bg-surface p-3.5 motion-safe:animate-rise">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Pick-up date" icon="calendar">
              <input
                type="date"
                value={value.date}
                min={todayAsInput()}
                onChange={(event) => onChange({ ...value, date: event.target.value })}
                aria-label="Pick-up date"
                className={cn(
                  "w-full min-w-0 bg-transparent text-[16px] text-ink placeholder:text-muted focus:outline-none",
                )}
              />
            </Field>

            <Field label="Pick-up time" icon="clock">
              <input
                type="time"
                value={value.time}
                onChange={(event) => onChange({ ...value, time: event.target.value })}
                aria-label="Pick-up time"
                className="w-full min-w-0 bg-transparent text-[16px] text-ink placeholder:text-muted focus:outline-none"
              />
            </Field>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-muted">
            <Icon name="calendar" size={14} className="shrink-0 text-muted-soft" />
            <span>Pick-up window: {scheduleLabel(value)}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
