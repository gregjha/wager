import { matchesListQuerySchema, paginationQuerySchema } from "@bi/shared";

export function parseMatchesListQuery(request: Request) {
  const { searchParams } = new URL(request.url);
  return matchesListQuerySchema.parse({
    first: searchParams.get("first") ?? undefined,
    after: searchParams.get("after") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    sport: searchParams.get("sport") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    price: searchParams.get("price") ?? undefined,
  });
}

export function parsePaginationQuery(request: Request) {
  const { searchParams } = new URL(request.url);
  return paginationQuerySchema.parse({
    first: searchParams.get("first") ?? undefined,
    after: searchParams.get("after") ?? undefined,
  });
}
