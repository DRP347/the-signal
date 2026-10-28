import { existsSync } from "node:fs";
import { migrate } from "drizzle-orm/postgres-js/migrator";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { db, closeDb } = await import("../lib/db");
try {
  await migrate(db(), { migrationsFolder: "./migrations" });
  console.log("Migrations applied");
} finally {
  await closeDb();
}
