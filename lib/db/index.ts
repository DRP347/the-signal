import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
let client: ReturnType<typeof postgres> | undefined;
export function sqlClient() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is not configured");
  return (client ??= postgres(process.env.DATABASE_URL, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  }));
}
export function db() {
  return drizzle(sqlClient(), { schema });
}
export async function closeDb() {
  await client?.end();
  client = undefined;
}
