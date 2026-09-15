import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getPayoutStatus } from "@bi/domain";
import { PLATFORM_FEE_BPS } from "@bi/shared";

import { auth } from "@/auth";
import { ConnectPayoutsButton } from "@/components/payouts/connect-payouts-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Payouts | Wager",
};

export default function PayoutsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-5xl font-bold">Payouts</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Entry fees from your matches go straight to your bank through Stripe.
        Wager keeps {PLATFORM_FEE_BPS / 100}% of each entry.
      </p>
      <Suspense fallback={<Skeleton className="mt-8 h-40 w-full" />}>
        <PayoutsStatus />
      </Suspense>
    </main>
  );
}

async function PayoutsStatus() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const status = await getPayoutStatus(session.user.id);

  return (
    <section className="mt-8 rounded-lg border-2 border-asphalt bg-card p-6">
      {status.payoutsReady ? (
        <>
          <p className="font-display text-3xl font-bold text-turf">
            Payouts are on
          </p>
          <p className="mt-1 text-muted-foreground">
            You can charge an entry fee on any match you host.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild={true}>
              <Link href="/match/new">Host a paid match</Link>
            </Button>
            <ConnectPayoutsButton variant="outline">
              Update payout details
            </ConnectPayoutsButton>
          </div>
        </>
      ) : status.connected ? (
        <>
          <p className="font-display text-3xl font-bold">
            Stripe needs a few more details
          </p>
          <p className="mt-1 text-muted-foreground">
            Finish setup to start charging entry fees. It picks up where you
            left off.
          </p>
          <ConnectPayoutsButton className="mt-5">
            Finish setup with Stripe
          </ConnectPayoutsButton>
        </>
      ) : (
        <>
          <p className="font-display text-3xl font-bold">
            Get paid for the games you run
          </p>
          <p className="mt-1 text-muted-foreground">
            Setup takes about five minutes. You&apos;ll need your bank details
            and a form of ID.
          </p>
          <ConnectPayoutsButton className="mt-5">
            Set up payouts with Stripe
          </ConnectPayoutsButton>
        </>
      )}
    </section>
  );
}
