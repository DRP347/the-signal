import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
