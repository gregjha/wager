import { formatCents } from "@wager/shared";

import { cn } from "@/lib/utils";

interface PriceTagProps {
  cents: number;
  currency: string;
  className?: string;
}

export function PriceTag({ cents, currency, className }: PriceTagProps) {
  return (
    <span
      className={cn(
        "font-display font-bold leading-none tabular",
        cents === 0 ? "text-turf" : "text-asphalt",
        className,
      )}
    >
      {formatCents(cents, currency)}
    </span>
  );
}
