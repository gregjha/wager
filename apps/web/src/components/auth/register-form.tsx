"use client";

import Link from "next/link";
import { useTransition } from "react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";

import OAuthSection from "./oauth-section";

export function RegisterForm() {
  const [isLoading, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="flex flex-col gap-y-4 pt-6">
        <OAuthSection
          action="register"
          isLoading={isLoading}
          startTransition={startTransition}
        />
      </CardContent>
      <CardFooter className="flex justify-center border-t px-6 pt-4">
        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
