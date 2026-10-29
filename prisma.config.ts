import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // The CLI (migrate, seed) prefers a direct connection: hosted Postgres such as Neon
    // hands the app a pooled DATABASE_URL, and migrations need a session the pooler
    // doesn't keep. The app itself always uses DATABASE_URL (src/lib/db.ts).
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
  },
});
