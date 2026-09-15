import { z } from "zod";

export const paginationQuerySchema = z.object({
  first: z.coerce.number().int().min(1).max(100).default(24),
  after: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const pageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  startCursor: z.string().nullable(),
  endCursor: z.string().nullable(),
});

export type PageInfo = z.infer<typeof pageInfoSchema>;

export function connectionEdgeSchema<T extends z.ZodType>(nodeSchema: T) {
  return z.object({
    cursor: z.string(),
    node: nodeSchema,
  });
}

export function connectionSchema<T extends z.ZodType>(nodeSchema: T) {
  return z.object({
    edges: z.array(connectionEdgeSchema(nodeSchema)),
    pageInfo: pageInfoSchema,
    exists: z.boolean(),
  });
}
