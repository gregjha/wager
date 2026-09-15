import { Prisma, PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

export * from "./generated/prisma/client";
export { Prisma, PrismaClient };

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to initialize Prisma");
  }

  return process.env.DATABASE_URL;
}

function isAccelerateUrl(url: string) {
  return url.startsWith("prisma://") || url.startsWith("prisma+postgres://");
}

const createPrismaClient = (): PrismaClient => {
  const databaseUrl = getDatabaseUrl();
  const log: Prisma.LogLevel[] =
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn", "info"]
      : ["error"];

  if (isAccelerateUrl(databaseUrl)) {
    return new PrismaClient({
      accelerateUrl: databaseUrl,
      log,
    }).$extends(withAccelerate()) as unknown as PrismaClient;
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
    log,
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
