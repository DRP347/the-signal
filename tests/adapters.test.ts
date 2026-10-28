import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchSource } from "../lib/ingestion/adapters";
import { sourceRegistry } from "../lib/ingestion/sources";
const context = {
  lastSuccess: null,
  cursor: null,
  etag: null,
  lastModified: null,
};
test("provider incident parser preserves official status, timestamps and unknowns", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({
      incidents: [
        {
          id: "unit-test-only",
          name: "TEST FIXTURE ONLY",
          status: "monitoring",
          shortlink: "https://example.com/incident",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T01:00:00Z",
          components: [{ name: "Example API" }],
          incident_updates: [{ body: "<p>Monitoring recovery</p>" }],
        },
      ],
    });
  try {
    const result = await fetchSource(
      sourceRegistry().find((s) => s.id === "github-status")!,
      context,
    );
    assert.equal(result.items[0].incident?.status, "monitoring");
    assert.equal(result.items[0].incident?.resolvedAt, null);
    assert.equal(result.items[0].incident?.update, "Monitoring recovery");
  } finally {
    globalThis.fetch = original;
  }
});
test("upstream access denial produces an error, never an outage item", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("", { status: 403 });
  try {
    await assert.rejects(
      () =>
        fetchSource(
          sourceRegistry().find((s) => s.id === "github-status")!,
          context,
        ),
      /403/,
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("RSS HTML is not rendered or retained as an article body", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      '<?xml version="1.0"?><rss version="2.0"><channel><title>Unit test</title><item><title>TEST FIXTURE ONLY</title><link>https://example.com/test</link><description><![CDATA[<p>Private article body</p>]]></description></item></channel></rss>',
    );
  try {
    const result = await fetchSource(
      sourceRegistry().find((s) => s.id === "ars")!,
      context,
    );
    assert.equal(result.items[0].preview, undefined);
    assert.equal(result.items[0].publishedAt, null);
  } finally {
    globalThis.fetch = original;
  }
});

test("GitHub uses second-precision dates and follows official cursor pagination", async () => {
  const original = globalThis.fetch;
  const requested: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    requested.push(url);
    if (requested.length === 1)
      return Response.json([], {
        headers: {
          link: '<https://api.github.com/advisories?after=test-cursor>; rel="next"',
        },
      });
    return Response.json([]);
  };
  try {
    await fetchSource(
      sourceRegistry().find((s) => s.id === "github-advisories")!,
      { ...context, cursor: "2026-01-01T00:00:00.000Z" },
    );
    assert.equal(
      new URL(requested[0]).searchParams.get("updated"),
      ">=2025-12-31T23:59:59Z",
    );
    assert.equal(
      new URL(requested[1]).searchParams.get("after"),
      "test-cursor",
    );
    assert.equal(requested.length, 2);
  } finally {
    globalThis.fetch = original;
  }
});
