import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { MatchFormWrapper } from "@/components/match/form/match-form-wrapper";
import { MatchFormFallback } from "@/components/suspense-fallbacks/match-form-fallback";

export default function NewMatchPage() {
  return (
    <Suspense fallback={<MatchFormFallback heading="Host a match" />}>
      <NewMatchPageContent />
    </Suspense>
  );
}

async function NewMatchPageContent() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <MatchFormWrapper formMode="create" />;
}
