"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  queryKeys,
  type JoinMatchResponse,
  type LeaveMatchResponse,
  type MatchConnection,
  type MatchesListQuery,
  type PayoutStatus,
  webApiClient,
} from "@wager/shared";

type MatchFilters = Pick<MatchesListQuery, "search" | "sport" | "city" | "price">;

function infiniteMatches(
  queryKey: readonly unknown[],
  path: string,
  filters: Partial<MatchFilters> = {},
) {
  return {
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: string | null }) =>
      webApiClient.get<MatchConnection>(path, {
        searchParams: {
          first: 24,
          after: pageParam ?? undefined,
          ...filters,
        },
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: MatchConnection) =>
      lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined,
  };
}

export function useMatches(filters: MatchFilters) {
  return useInfiniteQuery(
    infiniteMatches(queryKeys.matches.list(filters), "/api/matches", filters),
  );
}

export function hostingMatchesOptions() {
  return infiniteMatches(queryKeys.matches.hosting(), "/api/matches/hosting");
}

export function joinedMatchesOptions() {
  return infiniteMatches(queryKeys.matches.joined(), "/api/matches/joined");
}

export function useHostingMatches() {
  return useInfiniteQuery(hostingMatchesOptions());
}

export function useJoinedMatches() {
  return useInfiniteQuery(joinedMatchesOptions());
}

/**
 * Joins a match. Free matches resolve `confirmed`; paid matches resolve
 * with a Checkout URL the caller navigates to.
 */
export function useJoinMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) =>
      webApiClient.post<JoinMatchResponse>(`/api/matches/${matchId}/entry`, {
        body: { returnUrl: window.location.href.split("?")[0] },
      }),
    onSuccess: (result) => {
      if (result.kind === "confirmed") {
        void queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
      }
    },
  });
}

export function useLeaveMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) =>
      webApiClient.delete<LeaveMatchResponse>(`/api/matches/${matchId}/entry`),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    },
  });
}

export function usePayoutStatus(enabled = true) {
  return useQuery({
    queryKey: queryKeys.payouts.status,
    queryFn: () => webApiClient.get<PayoutStatus>("/api/payouts"),
    enabled,
  });
}
