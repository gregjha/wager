import type { HostDTO, RosterPlayerDTO } from "@bi/shared";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface RosterListProps {
  host: HostDTO;
  roster: RosterPlayerDTO[];
  capacity: number;
}

/** Numbered lineup: the order players locked in their spots. */
export function RosterList({ host, roster, capacity }: RosterListProps) {
  const openSpots = Math.max(capacity - roster.length, 0);

  return (
    <div>
      <div className="mb-3 flex items-center gap-3 rounded-md bg-muted px-3 py-2">
        <Avatar className="size-8">
          <AvatarImage src={host.image ?? ""} alt="" />
          <AvatarFallback>{initials(host.name)}</AvatarFallback>
        </Avatar>
        <span>
          <span className="font-semibold">{host.name ?? "Host"}</span>
          <span className="text-muted-foreground"> is hosting</span>
        </span>
      </div>
      <ol className="divide-y rounded-md border bg-card">
        {roster.map((player, index) => (
          <li key={player.id} className="flex items-center gap-3 px-3 py-2">
            <span className="w-6 text-right font-display text-lg font-bold text-muted-foreground tabular">
              {index + 1}
            </span>
            <Avatar className="size-7">
              <AvatarImage src={player.image ?? ""} alt="" />
              <AvatarFallback className="text-xs">
                {initials(player.name)}
              </AvatarFallback>
            </Avatar>
            <span>{player.name ?? "Player"}</span>
          </li>
        ))}
        {openSpots > 0 ? (
          <li className="px-3 py-2 text-muted-foreground">
            {openSpots} open {openSpots === 1 ? "spot" : "spots"}
          </li>
        ) : null}
      </ol>
    </div>
  );
}
