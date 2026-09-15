const dayFormat = new Intl.DateTimeFormat("en-US", { day: "numeric" });
const monthFormat = new Intl.DateTimeFormat("en-US", { month: "short" });
const weekdayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});
const fullFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function matchDateParts(iso: string) {
  const date = new Date(iso);
  return {
    day: dayFormat.format(date),
    month: monthFormat.format(date),
    weekday: weekdayFormat.format(date),
    time: timeFormat.format(date),
  };
}

export function formatMatchStart(iso: string): string {
  return fullFormat.format(new Date(iso));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/** Date -> value for `<input type="datetime-local">` in the browser's zone. */
export function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function refundDeadline(iso: string, cutoffHours: number): Date {
  return new Date(new Date(iso).getTime() - cutoffHours * 3_600_000);
}
