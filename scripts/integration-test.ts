import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { migrate } from "drizzle-orm/postgres-js/migrator";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (
  !process.env.TEST_DATABASE_URL ||
  !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error(
    "Set TEST_DATABASE_URL to an isolated database whose name ends in _test. Never run against production.",
  );
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const { db, sqlClient, closeDb } = await import("../lib/db");
const { registerSources, persistItems, ingest } =
  await import("../lib/ingestion/pipeline");
const { sourceRegistry } = await import("../lib/ingestion/sources");
const { HttpError } = await import("../lib/ingestion/http");
const { storyList } = await import("../lib/queries");
const registry = sourceRegistry();
const hn = registry.find((s) => s.id === "hn")!,
  dev = registry.find((s) => s.id === "dev")!,
  status = registry.find((s) => s.id === "github-status")!;
const fixture = {
  externalId: "integration-test-only",
  title: "TEST FIXTURE ONLY: React and Python integration fixture",
  url: "https://example.invalid/integration-fixture",
  publishedAt: "2026-01-01T00:00:00Z",
};
try {
  await migrate(db(), { migrationsFolder: "./migrations" });
  const sql = sqlClient();
  await sql`truncate sources,categories,technologies,stories cascade`;
  await registerSources();
  await persistItems(hn, [fixture]);
  await persistItems(hn, [fixture]);
  await persistItems(dev, [{ ...fixture, externalId: "second-test-source" }]);
  const [counts] =
    await sql`select (select count(*) from stories)::int as stories,(select count(*) from source_items)::int as items`;
  assert.equal(counts.stories, 1);
  assert.equal(counts.items, 2);
  const [story] = await sql`select source_count from stories`;
  assert.equal(story.source_count, 2);
  const watched = await storyList({ technologies: ["React", "Python"] });
  assert.equal(watched.total, 1);
  assert.equal(watched.rows.length, 1);
  const recent = await storyList({ since: new Date("2025-01-01") });
  assert.equal(recent.error, null);
  assert.equal(recent.total, 1);
  const vul = {
    identifiers: ["TEST-ONLY-A"],
    severity: null,
    cvss: null,
    affected: [],
    exploitation: "unknown" as const,
    action: null,
    references: [],
  };
  await persistItems(hn, [
    {
      ...fixture,
      externalId: "vuln-a",
      title: "TEST ADVISORY",
      url: "https://example.invalid/vuln-a",
      vulnerability: vul,
    },
  ]);
  await persistItems(dev, [
    {
      ...fixture,
      externalId: "vuln-b",
      title: "TEST ADVISORY ALIAS",
      url: "https://example.invalid/vuln-b",
      vulnerability: {
        ...vul,
        identifiers: ["TEST-ONLY-A", "TEST-ONLY-B"],
        exploitation: "known exploited",
      },
    },
  ]);
  const [v] = await sql`select details from vulnerabilities`;
  assert.equal(v.details.identifiers.length, 2);
  assert.equal(v.details.exploitation, "known exploited");
  assert.equal(v.details.severity, null);
  const incident = {
    provider: "GitHub",
    services: [],
    status: "investigating" as const,
    startedAt: null,
    updatedAt: null,
    resolvedAt: null,
    update: null,
  };
  await persistItems(status, [
    {
      ...fixture,
      externalId: "test-incident",
      url: "https://example.invalid/incident",
      incident,
    },
  ]);
  await persistItems(status, []);
  const [i] = await sql`select status from service_incidents`;
  assert.equal(i.status, "unknown");
  const before = await sql`select count(*)::int as n from stories`;
  await assert.rejects(() =>
    persistItems(dev, [
      {
        ...fixture,
        externalId: "rollback-good",
        url: "https://example.invalid/rollback-good",
        title: "TEST ROLLBACK FIRST",
      },
      {
        ...fixture,
        externalId: "rollback-invalid",
        url: "https://example.invalid/rollback-invalid",
        vulnerability: { ...vul, identifiers: [] },
      },
    ]),
  );
  const after = await sql`select count(*)::int as n from stories`;
  assert.equal(before[0].n, after[0].n);
  const outcome = await ingest({
    only: ["hn", "dev"],
    force: true,
    fetcher: async (s) => {
      if (s.id === "hn") throw new HttpError(429, 86400000);
      return { items: [fixture] };
    },
  });
  assert.equal(outcome.results[0].status, "failed");
  assert.equal(outcome.results[1].status, "success");
  let called = false;
  await ingest({
    only: ["hn"],
    force: true,
    fetcher: async () => {
      called = true;
      return { items: [] };
    },
  });
  assert.equal(
    called,
    false,
    "forced retry must still respect provider cooldown",
  );
  const conn = await sql.reserve();
  await conn`select pg_advisory_lock(77209123)`;
  const locked = await ingest({ only: [] });
  assert.ok(locked.skipped);
  await conn`select pg_advisory_unlock(77209123)`;
  conn.release();
  const [rls] =
    await sql`select count(*)::int as n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity`;
  assert.equal(rls.n, 12);
  console.log(
    "POSTGRES INTEGRATION PASSED: idempotence, cross-source grouping, alias merge, watchlist union, briefing window, rollback, missing-incident unknown state, failure isolation, cooldown, concurrency lock, RLS",
  );
} finally {
  await closeDb();
}
