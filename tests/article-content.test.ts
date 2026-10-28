import test from "node:test";
import assert from "node:assert/strict";
import {
  approvedArticle,
  articleFor,
  contentLabel,
  type FullArticle,
} from "../lib/article-content";
const fixture: FullArticle = {
  storyId: "fixture-only",
  kind: "original-article",
  author: "Layout test fixture",
  deck: "Test content only",
  publishedAt: "2026-10-26T00:00:00Z",
  reviewedAt: "2026-10-26T00:00:00Z",
  rights: { basis: "original", record: "Local layout fixture, never ingested" },
  sources: [{ title: "Test source", url: "https://example.org" }],
  blocks: [
    { type: "paragraph", text: "One" },
    { type: "paragraph", text: "Two" },
    { type: "paragraph", text: "Three" },
  ],
};
test("full article requires editorial identity, provenance, review and substantive blocks", () => {
  assert.equal(approvedArticle(fixture), true);
  for (const patch of [
    { author: "" },
    { reviewedAt: "" },
    { rights: { basis: "permission", record: "" } },
    { sources: [] },
    { sources: [{ title: "Unsafe", url: "javascript:alert(1)" }] },
    { blocks: [{ type: "paragraph", text: "An excerpt alone" }] },
  ])
    assert.equal(
      approvedArticle({ ...fixture, ...patch } as FullArticle),
      false,
    );
});
test("unregistered story and AI summary never become a full article", () => {
  const story = {
    id: "fixture-only",
    kind: "news",
    preview: "",
    aiSummary: "Optional generated text",
  };
  assert.equal(articleFor(story), null);
  assert.equal(contentLabel(story), "Source link");
  assert.equal(
    contentLabel({ ...story, preview: "Source supplied excerpt" }),
    "Source excerpt",
  );
  assert.equal(
    contentLabel({ ...story, kind: "vulnerability" }),
    "Official advisory",
  );
});
