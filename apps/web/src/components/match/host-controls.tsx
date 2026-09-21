"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil } from "lucide-react";
import { formatCents, type MatchDetailDTO } from "@wager/shared";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cancelMatch } from "@/lib/actions/server-actions";

interface HostControlsProps {
  match: Pick<
    MatchDetailDTO,
    "id" | "status" | "spotsTaken" | "entryFeeCents" | "currency"
  >;
}

export function HostControls({ match }: HostControlsProps) {
  const [cancelling, startTransition] = useTransition();

  if (match.status !== "Open") return null;

  const refundTotal = match.entryFeeCents * match.spotsTaken;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" asChild={true}>
        <Link href={`/match/${match.id}/edit`}>
          <Pencil />
          Edit match
        </Link>
      </Button>
      <Dialog>
        <DialogTrigger asChild={true}>
          <Button variant="destructive">Cancel match</Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Cancel this match?</DialogTitle>
            <DialogDescription>
              {match.spotsTaken === 0
                ? "Nobody has joined yet. The match comes off the schedule."
                : match.entryFeeCents === 0
                  ? `${match.spotsTaken} players will see it's cancelled.`
                  : `All ${match.spotsTaken} players get a full refund, ${formatCents(refundTotal, match.currency)} in total. This can't be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild={true} disabled={cancelling}>
              <Button variant="outline">Keep match</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={() =>
                startTransition(async () => {
                  await cancelMatch(match.id);
                })
              }
            >
              {cancelling ? <Spinner /> : null}
              Cancel match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
