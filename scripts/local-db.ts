import EmbeddedPostgres from "embedded-postgres";
import { mkdir, access } from "node:fs/promises";
await mkdir(".local", { recursive: true });
const pg = new EmbeddedPostgres({
  databaseDir: ".local/postgres",
  user: "signal",
  password: "signal_local_only",
  port: 54329,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});
try {
  await access(".local/postgres/PG_VERSION");
} catch {
  await pg.initialise();
}
await pg.start();
try {
  await pg.createDatabase("signal");
} catch (error) {
  if (!String(error).includes("already exists")) throw error;
}
console.log(
  "Local PostgreSQL ready on 127.0.0.1:54329 (database: signal). Keep this process running.",
);
const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 60000);
