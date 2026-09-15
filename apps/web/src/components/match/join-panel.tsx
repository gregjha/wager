"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents, type MatchDetailDTO } from "@bi/shared";

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
import { authClient } from "@/lib/auth/auth-client";
import { refundDeadline } from "@/lib/format/match-time";
import { useJoinMatch, useLeaveMatch } from "@/lib/query/hooks/use-matches";

import { PriceTag } from "./price-tag";
import { RosterMeter } from "./roster-meter";

interface JoinPanelProps {
  match: MatchDetailDTO;
  /** `?checkout=` from the Stripe redirect, if any. */
  checkoutResult?: string;
}

const deadlineFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function JoinPanel({ match, checkoutResult }: JoinPanelProps) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const join = useJoinMatch();
  const leave = useLeaveMatch();
  const [leaveOpen, setLeaveOpen] = useState(false);

  const isPaid = match.entryFeeCents > 0;
  const price = formatCents(match.entryFeeCents, match.currency);
  const isFull = match.spotsTaken >= match.capacity;
  const hasStarted = new Date(match.startsAt) <= new Date();
  const deadline = refundDeadline(match.startsAt, match.refundCutoffHours);
  const refundOpen = new Date() < deadline;
  const isHost = session?.user?.id === match.host.id;
  const status = match.viewerEntryStatus;

  function handleJoin() {
    join.mutate(match.id, {
      onSuccess: (result) => {
        if (result.kind === "checkout") {
          window.location.assign(result.url);
          return;
        }
        router.refresh();
      },
    });
  }

  function handleLeave() {
    leave.mutate(match.id, {
      onSuccess: () => {
        setLeaveOpen(false);
        router.refresh();
      },
    });
  }

  const error = join.error ?? leave.error;

  return (
    <section
      aria-label="Join this match"
      className="rounded-lg border-2 border-asphalt bg-card p-5"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {isPaid ? "Entry fee" : "Entry"}
          </p>
          <PriceTag
            cents={match.entryFeeCents}
            currency={match.currency}
            className="text-5xl"
          />
        </div>
        <RosterMeter
          taken={match.spotsTaken}
          capacity={match.capacity}
          className="items-end"
        />
      </div>

      {checkoutResult === "success" && status !== "Confirmed" ? (
        <p role="status" className="mt-4 rounded-md bg-line/30 px-3 py-2 text-sm">
          Payment received. Your spot confirms as soon as Stripe checks in —
          refresh in a few seconds.
        </p>
      ) : null}
      {checkoutResult === "cancelled" && status !== "Confirmed" ? (
        <p role="status" className="mt-4 rounded-md bg-muted px-3 py-2 text-sm">
          Checkout was closed before paying. Your spot is held for a few more
          minutes if you want to finish.
        </p>
      ) : null}

      <div className="mt-5">
        {match.status === "Cancelled" ? (
          <p className="font-semibold text-destructive">
            The host cancelled this match. Paid players were refunded in full.
          </p>
        ) : match.status === "Completed" || hasStarted ? (
          <p className="text-muted-foreground">This match has already started.</p>
        ) : sessionPending ? (
          <Button size="lg" className="w-full" disabled={true}>
            <Spinner />
          </Button>
        ) : !session?.user ? (
          <Button size="lg" className="w-full" asChild={true}>
            <Link href="/login">Sign in to join</Link>
          </Button>
        ) : isHost ? (
          <p className="text-muted-foreground">
            You&apos;re hosting. Players who join show up on the roster below.
          </p>
        ) : status === "Confirmed" ? (
          <div className="flex flex-col gap-3">
            <p className="font-display text-2xl font-bold text-turf">
              You&apos;re on the roster
            </p>
            <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
              <DialogTrigger asChild={true}>
                <Button variant="outline" className="w-full">
                  Leave match
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Leave this match?</DialogTitle>
                  <DialogDescription>
                    {!isPaid
                      ? "Your spot opens up for someone else."
                      : refundOpen
                        ? `You'll get your ${price} back in full. Refunds usually land in 5–10 business days.`
                        : `The refund window closed ${deadlineFormat.format(deadline)}, so your ${price} won't be refunded.`}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild={true}>
                    <Button variant="outline" disabled={leave.isPending}>
                      Keep my spot
                    </Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    disabled={leave.isPending}
                    onClick={handleLeave}
                  >
                    {leave.isPending ? <Spinner /> : null}
                    Leave match
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : status === "Pending" ? (
          <Button
            size="lg"
            className="w-full"
            disabled={join.isPending}
            onClick={handleJoin}
          >
            {join.isPending ? <Spinner /> : null}
            Finish paying {price}
          </Button>
        ) : isFull ? (
          <Button size="lg" className="w-full" disabled={true}>
            Match is full
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full font-semibold"
            disabled={join.isPending}
            onClick={handleJoin}
          >
            {join.isPending ? <Spinner /> : null}
            {isPaid ? `Pay ${price} and join` : "Join match"}
          </Button>
        )}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      {isPaid && match.status === "Open" ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Full refund if you leave before{" "}
          <span className="font-medium text-asphalt">
            {deadlineFormat.format(deadline)}
          </span>
          , or if the host cancels. Payments are handled by Stripe.
        </p>
      ) : null}
    </section>
  );
}
