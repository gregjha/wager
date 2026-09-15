"use client";

import { useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { beginPayoutOnboarding } from "@/lib/actions/server-actions";

interface Props {
  children: ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

/** Server action creates a fresh onboarding link and redirects to Stripe. */
export function ConnectPayoutsButton({
  children,
  className,
  variant = "default",
}: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      className={className}
      variant={variant}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await beginPayoutOnboarding();
        })
      }
    >
      {pending ? <Spinner /> : null}
      {children}
    </Button>
  );
}
