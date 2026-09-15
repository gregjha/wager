import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getMatchById } from "@bi/domain";

import { auth } from "@/auth";
import { MatchFormWrapper } from "@/components/match/form/match-form-wrapper";
import { MatchFormFallback } from "@/components/suspense-fallbacks/match-form-fallback";

type PageProps = { params: Promise<{ id: string }> };

export default function EditMatchPage({ params }: PageProps) {
  return (
    <Suspense fallback={<MatchFormFallback heading="Edit match" />}>
      <EditMatchPageContent params={params} />
    </Suspense>
  );
}

async function EditMatchPageContent({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const match = await getMatchById(id, session.user.id);

  if (!match) {
    notFound();
  }

  if (match.host.id !== session.user.id || match.status !== "Open") {
    redirect(`/match/${id}`);
  }

  return <MatchFormWrapper formMode="update" initialMatch={match} />;
}
