import { cn } from "@/lib/utils";

interface RosterMeterProps {
  taken: number;
  capacity: number;
  className?: string;
}

/** Past this many seats, pips get too small to read — switch to a bar. */
const MAX_PIPS = 16;

/**
 * Lineup-card style seat meter. One pip per seat; filled pips are taken.
 */
export function RosterMeter({ taken, capacity, className }: RosterMeterProps) {
  const open = Math.max(capacity - taken, 0);
  const label =
    open === 0
      ? "Full"
      : `${open} ${open === 1 ? "spot" : "spots"} left`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {capacity <= MAX_PIPS ? (
        <div
          className="flex flex-wrap gap-1"
          role="img"
          aria-label={`${taken} of ${capacity} spots taken`}
        >
          {Array.from({ length: capacity }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-2.5 w-4 rounded-[2px]",
                i < taken ? "bg-court" : "border border-input bg-white",
              )}
            />
          ))}
        </div>
      ) : (
        <div
          className="h-2.5 w-full max-w-48 overflow-hidden rounded-[2px] border border-input bg-white"
          role="img"
          aria-label={`${taken} of ${capacity} spots taken`}
        >
          <div
            className="h-full bg-court"
            style={{ width: `${Math.min((taken / capacity) * 100, 100)}%` }}
          />
        </div>
      )}
      <span
        className={cn(
          "text-sm tabular",
          open === 0 ? "font-semibold text-destructive" : "text-muted-foreground",
          open > 0 && open <= 2 && "font-semibold text-asphalt",
        )}
      >
        {label}
        <span className="text-muted-foreground font-normal">
          {" "}
          of {capacity}
        </span>
      </span>
    </div>
  );
}
