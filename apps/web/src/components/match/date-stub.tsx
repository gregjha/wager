import { formatDuration, matchDateParts } from "@/lib/format/match-time";
import { cn } from "@/lib/utils";

interface DateStubProps {
  startsAt: string;
  durationMinutes?: number;
  className?: string;
}

/** Tear-off ticket stub showing when the match is. */
export function DateStub({
  startsAt,
  durationMinutes,
  className,
}: DateStubProps) {
  const { day, month, weekday, time } = matchDateParts(startsAt);

  return (
    <div
      className={cn(
        "relative flex w-24 shrink-0 flex-col items-center justify-center bg-asphalt px-2 py-4 text-white",
        className,
      )}
    >
      <span className="text-sm text-white/70">{weekday}</span>
      <span className="font-display text-5xl font-bold leading-none tabular">
        {day}
      </span>
      <span className="font-display text-lg font-semibold">{month}</span>
      <span className="mt-2 border-t border-line pt-1 text-sm font-medium tabular">
        {time}
      </span>
      {durationMinutes ? (
        <span className="text-xs text-white/70">
          {formatDuration(durationMinutes)}
        </span>
      ) : null}
      <span
        aria-hidden
        className="perforation absolute inset-y-0 -right-[5px] w-[10px]"
      />
    </div>
  );
}
