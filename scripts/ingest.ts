import { existsSync } from "node:fs";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { ingest } = await import("../lib/ingestion/pipeline");
const { closeDb } = await import("../lib/db");
try {
  const only = process.argv
    .find((a) => a.startsWith("--only="))
    ?.slice(7)
    .split(",");
  const result = await ingest({
    force: process.argv.includes("--force"),
    only,
  });
  console.log(JSON.stringify(result));
  if (
    result.results.length &&
    result.results.every((r) => r.status === "failed")
  )
    process.exitCode = 1;
} finally {
  await closeDb();
}
