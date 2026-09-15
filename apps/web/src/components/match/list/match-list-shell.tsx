"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import type { MatchConnection } from "@bi/shared";

import MatchSkeletonList from "./match-skeleton-list";
import { MatchCard } from "./match-card";

type MatchInfiniteQueryResult = Pick<
  UseInfiniteQueryResult<InfiniteData<MatchConnection>>,
  | "data"
  | "error"
  | "fetchNextPage"
  | "hasNextPage"
  | "isFetchingNextPage"
  | "isLoading"
>;

interface MatchListShellProps extends MatchInfiniteQueryResult {
  emptyState?: React.ReactElement;
}

export function MatchListShell({
  data,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  emptyState,
}: Readonly<MatchListShellProps>) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const matches =
    data?.pages.flatMap((page) => page.edges.map((edge) => edge.node)) ?? [];
  const exists = data?.pages[0]?.exists ?? false;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    const element = loadMoreRef.current;
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  if (isLoading) {
    return <MatchSkeletonList />;
  }

  if (error) {
    return (
      <p role="alert" className="text-destructive">
        Matches didn&apos;t load: {error.message}. Refresh to try again.
      </p>
    );
  }

  if (!exists) {
    return emptyState ?? null;
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
      {isFetchingNextPage && <MatchSkeletonList className="mt-4" />}
      <div ref={loadMoreRef} className="h-10" />
    </>
  );
}
