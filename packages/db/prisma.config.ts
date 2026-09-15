import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Monorepo .env source of truth lives at apps/web/.env. Load it first,
// then allow a local packages/db/.env to override if present.
loadEnv({ path: "../../apps/web/.env" });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun run prisma/seed.mjs",
  },
  datasource: {
    url: env("DATABASE_URL"),
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
