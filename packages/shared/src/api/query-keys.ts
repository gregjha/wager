import type { MatchesListQuery } from "./match-dto";

type MatchListFilters = Pick<MatchesListQuery, "search" | "sport" | "city" | "price">;

export const queryKeys = {
  matches: {
    all: ["matches"] as const,
    list: (filters: MatchListFilters) =>
      ["matches", "list", filters] as const,
    hosting: (params: { first?: number } = {}) =>
      ["matches", "hosting", params] as const,
    joined: (params: { first?: number } = {}) =>
      ["matches", "joined", params] as const,
    detail: (id: string) => ["matches", "detail", id] as const,
  },
  payouts: {
    status: ["payouts", "status"] as const,
  },
} as const;
