import type { EntryStatusLabel, MatchStatusLabel } from "@bi/shared";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  entryStatus: EntryStatusLabel | null;
  matchStatus: MatchStatusLabel;
  className?: string;
}

/** Shows the one status a player most needs to see on a card. */
export function EntryStatusBadge({ entryStatus, matchStatus, className }: Props) {
  if (matchStatus === "Cancelled") {
    return (
      <Badge className={cn("bg-destructive text-white", className)}>
        Cancelled
      </Badge>
    );
  }
  if (matchStatus === "Completed") {
    return (
      <Badge variant="secondary" className={className}>
        Played
      </Badge>
    );
  }
  if (entryStatus === "Confirmed") {
    return (
      <Badge className={cn("bg-turf text-white", className)}>You&apos;re in</Badge>
    );
  }
  if (entryStatus === "Pending") {
    return (
      <Badge className={cn("bg-line text-asphalt", className)}>
        Payment pending
      </Badge>
    );
  }
  return null;
}
