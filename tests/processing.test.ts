import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalUrl,
  classify,
  plain,
  preview,
  ranking,
  sameStory,
  validDate,
  safeUrl,
} from "../lib/processing";
import {
  authenticated,
  isolate,
  mergeVulnerability,
} from "../lib/ingestion/pipeline";
import { retryDelay } from "../lib/ingestion/http";
import type { Vulnerability } from "../lib/types";
test("normalization removes only tracking parameters, preserves identity, is idempotent", () => {
  const u = canonicalUrl(
    "https://www.EXAMPLE.com/article/?id=2&utm_source=feed#top",
  );
  assert.equal(u, "https://example.com/article?id=2");
  assert.equal(canonicalUrl(u), u);
  assert.notEqual(
    canonicalUrl("https://example.com/?id=3"),
    canonicalUrl("https://example.com/?id=2"),
  );
});
test("unsafe links are rejected", () => {
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("https://user:password@example.com"), null);
  assert.ok(safeUrl("https://example.com"));
  assert.throws(() => canonicalUrl("bad"));
});
test("preview strips active HTML and remains bounded", () => {
  assert.equal(
    plain("<script>alert(1)</script><p>Safe &amp; clear</p>"),
    "Safe & clear",
  );
  assert.ok(preview("word ".repeat(100)).split(" ").length <= 45);
  assert.equal(preview(undefined), "");
});
test("near-identical stories group only within a time window", () => {
  const a = {
    title:
      "Researchers disclose critical software vulnerability affecting cloud deployments worldwide",
    publishedAt: "2026-01-01T12:00:00Z",
  };
  assert.ok(
    sameStory(a, {
      ...a,
      title:
        "Researchers disclose critical software vulnerability affecting cloud deployments worldwide!",
    }),
  );
  assert.equal(
    sameStory(a, { ...a, publishedAt: "2026-01-09T12:00:00Z" }),
    false,
  );
  assert.equal(sameStory(a, { ...a, publishedAt: null }), false);
});
test("different version identifiers and incident topics must not merge", () => {
  const a = {
    title: "Vendor patches a critical vulnerability in package version 1.2.3",
    publishedAt: "2026-01-01T12:00:00Z",
  };
  assert.equal(
    sameStory(a, { ...a, title: a.title.replace("1.2.3", "1.2.4") }),
    false,
  );
  assert.equal(
    sameStory(a, {
      ...a,
      title: "Vendor announces a new database service available in Europe",
    }),
    false,
  );
});
test("classification uses word boundaries and known technologies", () => {
  assert.deepEqual(
    classify({
      externalId: "test",
      title: "Next.js security update for React",
      url: "https://example.com",
      publishedAt: null,
    }),
    { category: "security", technologies: ["React", "Next.js"] },
  );
  assert.equal(
    classify({
      externalId: "test",
      title: "A chair design",
      url: "https://example.com",
      publishedAt: null,
    }).category,
    "technology",
  );
});
test("invalid and absent timestamps stay unknown", () => {
  assert.equal(validDate(null), null);
  assert.equal(validDate("not a date"), null);
  assert.equal(validDate("2026-01-01"), "2026-01-01T00:00:00.000Z");
});
test("ranking is deterministic and never creates a CVSS severity", () => {
  const item = {
    externalId: "test",
    title: "A release",
    url: "https://example.com",
    publishedAt: "2026-01-01T00:00:00Z",
  };
  assert.deepEqual(
    ranking(item, 3, new Date("2026-01-01")),
    ranking(item, 3, new Date("2026-01-01")),
  );
  assert.ok(
    ranking(item, 3, new Date("2026-01-01")).score >
      ranking(item, 3, new Date("2026-02-01")).score,
  );
});
test("advisory merging preserves known exploitation and unknown severity", () => {
  const a: Vulnerability = {
    identifiers: ["TEST-A"],
    severity: null,
    cvss: null,
    affected: [],
    exploitation: "known exploited",
    action: "Consult vendor",
    references: ["https://example.com/a"],
  };
  const b: Vulnerability = {
    ...a,
    identifiers: ["TEST-B"],
    exploitation: "unknown",
    action: null,
    references: ["https://example.com/b"],
  };
  const merged = mergeVulnerability(a, b);
  assert.equal(merged.exploitation, "known exploited");
  assert.equal(merged.severity, null);
  assert.equal(merged.cvss, null);
  assert.equal(merged.action, "Consult vendor");
  assert.equal(merged.references.length, 2);
});
test("ingestion authentication fails closed", () => {
  const secret = "a".repeat(32);
  assert.equal(authenticated(null, secret), false);
  assert.equal(authenticated("Bearer short", "short"), false);
  assert.equal(authenticated("Bearer " + secret, secret), true);
  assert.equal(authenticated("Bearer " + "b".repeat(32), secret), false);
});
test("a failed source does not stop subsequent source tasks", async () => {
  const values = await isolate([
    async () => {
      throw new Error("Unavailable");
    },
    async () => 42,
  ]);
  assert.equal(values[0].status, "rejected");
  assert.deepEqual(values[1], { status: "fulfilled", value: 42 });
});
test("rate limits support numeric and HTTP-date Retry-After", () => {
  assert.equal(retryDelay("10"), 10000);
  assert.equal(
    retryDelay(
      "Wed, 01 Jan 2025 00:00:20 GMT",
      Date.parse("2025-01-01T00:00:00Z"),
    ),
    20000,
  );
  assert.equal(retryDelay("invalid"), 0);
});
