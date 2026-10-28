import articles from "@/data/articles.json";
import type { Story } from "./db/schema";
export type ArticleBlock = { type: "paragraph" | "heading"; text: string };
export type FullArticle = {
  storyId: string;
  kind: "original-article" | "verified-briefing";
  author: string;
  deck: string;
  publishedAt: string;
  reviewedAt: string;
  rights: { basis: "original" | "permission" | "open-license"; record: string };
  sources: { title: string; url: string }[];
  blocks: ArticleBlock[];
};
function isLink(url: string) {
  try {
    const u = new URL(url);
    return (
      ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
    );
  } catch {
    return false;
  }
}
export function approvedArticle(article: FullArticle): boolean {
  return Boolean(
    article.storyId &&
    ["original-article", "verified-briefing"].includes(article.kind) &&
    article.author?.trim() &&
    article.deck?.trim() &&
    Number.isFinite(Date.parse(article.publishedAt)) &&
    Number.isFinite(Date.parse(article.reviewedAt)) &&
    ["original", "permission", "open-license"].includes(
      article.rights?.basis,
    ) &&
    article.rights?.record?.trim() &&
    article.sources?.length &&
    article.sources.every((s) => s.title.trim() && isLink(s.url)) &&
    article.blocks?.length &&
    article.blocks.every(
      (b) => ["paragraph", "heading"].includes(b.type) && b.text.trim(),
    ) &&
    article.blocks.filter((b) => b.type === "paragraph").length >= 3,
  );
}
export function articleFor(story: Pick<Story, "id">): FullArticle | null {
  return (
    (articles as FullArticle[]).find(
      (a) => a.storyId === story.id && approvedArticle(a),
    ) ?? null
  );
}
export function contentLabel(story: Pick<Story, "id" | "kind" | "preview">) {
  const article = articleFor(story);
  return article
    ? article.kind === "original-article"
      ? "Original article"
      : "Verified briefing"
    : story.kind === "vulnerability"
      ? "Official advisory"
      : story.kind === "incident"
        ? "Official incident record"
        : story.preview
          ? "Source excerpt"
          : "Source link";
}
