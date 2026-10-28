import test from "node:test";
import assert from "node:assert/strict";
import { selectEdition, sourceLabel } from "../lib/editorial";
import type { EditorialStory } from "../lib/editorial";
import {
  approvedVisual,
  illustrationFor,
  type EditorialVisual,
} from "../lib/visuals";
function story(id: string, category = "community"): EditorialStory {
  return {
    id,
    slug: id,
    title: "Test fixture only",
    kind: "news",
    category,
    technologyTags: [],
    canonicalUrl: "https://example.org/" + id,
    normalizedTitle: "test fixture only",
    preview: "",
    summaryMode: "preview",
    aiSummary: null,
    aiSources: null,
    publishedAt: null,
    eventAt: null,
    firstSeen: new Date(0),
    lastVerified: new Date(0),
    verification: "reported",
    rank: 0,
    rankReasons: [],
    sourceCount: 1,
  };
}
test("edition assigns each story once across all sections, including duplicate query results", () => {
  const rows = Array.from({ length: 20 }, (_, i) =>
    story(String(i), i % 3 === 0 ? "developers" : "community"),
  );
  const e = selectEdition([...rows, ...rows]);
  const all = [
    e.lead,
    ...e.secondary,
    ...e.briefing,
    ...e.collections.flatMap((c) => c.stories),
  ].filter(Boolean);
  assert.equal(all.length, new Set(all.map((s) => s!.id)).size);
  assert.ok(
    e.collections.every((c) =>
      c.stories.every((s) => s.category === c.category),
    ),
  );
  assert.equal(e.briefing.length, 6);
});
test("empty and sparse editions never invent fallback stories", () => {
  assert.equal(selectEdition([]).lead, null);
  const e = selectEdition([story("one")]);
  assert.equal(e.lead?.id, "one");
  assert.equal(
    e.secondary.length + e.briefing.length + e.collections.length,
    0,
  );
  assert.equal(e.collections.length, 0);
  assert.equal(
    selectEdition([{ ...story("advisory"), kind: "vulnerability" }]).lead,
    null,
  );
});
test("illustrations must match a topic; unsupported topics stay text led", () => {
  assert.equal(illustrationFor(story("one")), null);
  assert.equal(
    illustrationFor({
      ...story("ai"),
      title: "An introduction to machine learning",
    }),
    "ai",
  );
  assert.equal(
    sourceLabel({
      ...story("s"),
      attribution: [
        { name: "Publisher", url: "https://example.org" },
        { name: "Publisher", url: "https://example.org/2" },
      ],
    }),
    "Publisher",
  );
});
test("external photography requires rights, verification and a reviewed crop", () => {
  const v: EditorialVisual = {
    id: "test",
    relatedStory: "story",
    subject: "test",
    kind: "photograph",
    src: "/media/test.webp",
    sourceUrl: "https://example.org/photo",
    creator: "Test creator",
    rightsHolder: "Test holder",
    caption: "Test caption",
    credit: "Test credit",
    license: "Test permission",
    permissionRecord: "Test record",
    alt: "Test description",
    verification: "verified",
    verifiedAt: "2026-10-25T00:00:00Z",
    width: 100,
    height: 100,
    focalPoint: { x: 0.5, y: 0.5 },
    cropReviewed: true,
  };
  assert.equal(approvedVisual(v), true);
  for (const patch of [
    { verification: "pending" },
    { license: "" },
    { permissionRecord: "" },
    { verifiedAt: null },
    { cropReviewed: false },
    { src: "https://example.org/image" },
    { src: "/media/../secret" },
    { focalPoint: { x: 2, y: 0 } },
  ])
    assert.equal(approvedVisual({ ...v, ...patch } as EditorialVisual), false);
});

test("lead selection respects editorial order even without illustration", () => {
  const first = story("most-important");
  const illustrated = { ...story("second"), title: "An AI story" };
  assert.equal(selectEdition([first, illustrated]).lead?.id, first.id);
});
test("DNS and planning receive distinct art; generic network subjects have no globe fallback", () => {
  assert.equal(
    illustrationFor({
      ...story("dns"),
      title: "France asks providers to prepare DNS blocks",
    }),
    "dns",
  );
  assert.equal(
    illustrationFor({
      ...story("planning"),
      title: "Want to build a UK datacenter? Whitehall transfers you",
    }),
    "planning",
  );
  assert.equal(
    illustrationFor({ ...story("network"), title: "Internet news" }),
    null,
  );
});
