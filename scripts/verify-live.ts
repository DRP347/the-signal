import { existsSync } from "node:fs";
import assert from "node:assert/strict";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { sqlClient, closeDb } = await import("../lib/db");
const { persistItems } = await import("../lib/ingestion/pipeline");
const { sourceRegistry } = await import("../lib/ingestion/sources");
try {
  const sql = sqlClient();
  const counts =
    await sql`select (select count(*) from stories)::int as stories,(select count(*) from source_items)::int as items,(select count(*) from vulnerabilities)::int as vulnerabilities,(select count(*) from service_incidents)::int as incidents`;
  assert.ok(counts[0].stories > 0);
  assert.ok(counts[0].vulnerabilities > 0);
  const sources =
    await sql`select id, last_success from sources where last_success is not null`;
  assert.ok(sources.length >= 3);
  const [row] =
    await sql`select si.*,s.preview from source_items si join stories s on s.id=si.story_id where si.source_id='hn' limit 1`;
  assert.ok(row);
  const hn = sourceRegistry().find((s) => s.id === "hn")!;
  await persistItems(hn, [
    {
      externalId: row.external_id,
      title: row.title,
      url: row.original_url,
      publishedAt: row.published_at?.toISOString() ?? null,
      preview: row.preview,
      ...row.metadata,
    },
  ]);
  const [after] =
    await sql`select (select count(*) from stories)::int as stories,(select count(*) from source_items)::int as items`;
  assert.equal(after.stories, counts[0].stories);
  assert.equal(after.items, counts[0].items);
  const [orphans] =
    await sql`select count(*)::int as n from source_items where story_id is null`;
  assert.equal(orphans.n, 0);
  console.log(
    JSON.stringify({
      counts: counts[0],
      successfulSources: sources.map((s) => s.id),
      idempotent: true,
    }),
  );
  console.log("LIVE VERIFICATION PASSED");
} finally {
  await closeDb();
}
