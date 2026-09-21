"use client";

import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  queryKeys,
  type JoinMatchResponse,
  type MatchConnection,
} from "@wager/shared";

import { mobileApiClient } from "@/lib/api-client";

export function useMatches() {
  return useInfiniteQuery({
    queryKey: queryKeys.matches.list({}),
    queryFn: async ({ pageParam }) => {
      return mobileApiClient.get<MatchConnection>("/matches", {
        searchParams: {
          first: 24,
          after: pageParam ?? undefined,
        },
      });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined,
  });
}

export type MobileJoinOutcome = "confirmed" | "paid" | "cancelled";

/**
 * Joins a match. Paid matches open Stripe Checkout in an auth session; the
 * web `/checkout/return` route bounces back to `wager://` when it's done.
 */
export function useJoinMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string): Promise<MobileJoinOutcome> => {
      const returnUrl = Linking.createURL("/");
      const result = await mobileApiClient.post<JoinMatchResponse>(
        `/matches/${matchId}/entry`,
        { body: { returnUrl } },
      );

      if (result.kind === "confirmed") return "confirmed";

      const session = await WebBrowser.openAuthSessionAsync(
        result.url,
        returnUrl,
      );
      if (session.type !== "success") return "cancelled";

      const checkout = new URL(session.url).searchParams.get("checkout");
      return checkout === "success" ? "paid" : "cancelled";
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    },
  });
}
