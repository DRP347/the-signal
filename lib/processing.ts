import { createHash } from "node:crypto";
import type { Item, Category } from "./types";
import { technologyNames } from "./types";
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}
export function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
export function canonicalUrl(value: string) {
  const safe = safeUrl(value);
  if (!safe) throw new Error("Invalid source URL");
  const url = new URL(safe);
  url.hash = "";
  for (const key of [...url.searchParams.keys()])
    if (/^(utm_|fbclid$|gclid$|ref$)/i.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
}
export function plain(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(
      /&(?:nbsp|amp|quot|apos|lt|gt);/g,
      (x) =>
        ({
          "&nbsp;": " ",
          "&amp;": "&",
          "&quot;": '"',
          "&apos;": "'",
          "&lt;": "<",
          "&gt;": ">",
        })[x]!,
    )
    .replace(/&#(\d+);/g, (_, n) =>
      Number(n) <= 0x10ffff ? String.fromCodePoint(Number(n)) : "",
    )
    .replace(/\s+/g, " ")
    .trim();
}
export function preview(value?: string) {
  if (!value) return "";
  const text = plain(value);
  const words = text.split(/\s+/).slice(0, 45).join(" ");
  return words.length < text.length
    ? words.replace(/[,.!?;:]$/, "") + "…"
    : words;
}
export function normalizedTitle(title: string) {
  return plain(title)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function validDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}
const stop = new Set([
  "the",
  "a",
  "an",
  "of",
  "to",
  "and",
  "in",
  "on",
  "for",
  "with",
  "is",
  "at",
  "by",
  "from",
  "new",
]);
export function sameStory(
  a: { title: string; publishedAt: string | null },
  b: { title: string; publishedAt: string | null },
) {
  if (
    !a.publishedAt ||
    !b.publishedAt ||
    Math.abs(Date.parse(a.publishedAt) - Date.parse(b.publishedAt)) >
      48 * 3600000
  )
    return false;
  const x = normalizedTitle(a.title),
    y = normalizedTitle(b.title);
  const ids = (s: string) =>
    s
      .match(/(?:cve-\d{4}-\d+|ghsa-[\w-]+|\d+(?:\.\d+)+)/g)
      ?.sort()
      .join(",") ?? "";
  if (ids(x) !== ids(y)) return false;
  if (x === y) return true;
  const xs = new Set(x.split(" ").filter((w) => !stop.has(w))),
    ys = new Set(y.split(" ").filter((w) => !stop.has(w)));
  if (xs.size < 6 || ys.size < 6) return false;
  const common = [...xs].filter((w) => ys.has(w)).length;
  return common / new Set([...xs, ...ys]).size >= 0.84;
}
export function classify(item: Item): {
  category: Category;
  technologies: string[];
} {
  const value = `${item.title} ${item.preview ?? ""} ${(item.vulnerability?.affected ?? []).map((a) => `${a.product} ${a.ecosystem ?? ""}`).join(" ")}`;
  const aliases: Record<string, RegExp> = {
    React: /\breact(?:js)?\b/i,
    "Next.js": /\bnext\.?js\b/i,
    "Node.js": /\bnode\.?js\b/i,
    PHP: /\bphp\b|\bcomposer\b/i,
    Laravel: /\blaravel\b/i,
    WordPress: /\bwordpress\b/i,
    TypeScript: /\btypescript\b/i,
    Python: /\bpython\b|\bpypi\b/i,
    PostgreSQL: /\bpostgres(?:ql)?\b/i,
    GitHub: /\bgithub\b/i,
    Docker: /\bdocker\b/i,
    Kubernetes: /\bkubernetes\b|\bk8s\b/i,
  };
  const tags = technologyNames.filter(
    (t) => aliases[t].test(value) || (item.technologies ?? []).includes(t),
  );
  const category =
    item.category ??
    (item.vulnerability ||
    /\b(vulnerability|ransomware|breach|exploit|malware|cybersecurity|security)\b/i.test(
      value,
    )
      ? "security"
      : /\b(ai|llm|artificial intelligence|machine learning|openai|anthropic)\b/i.test(
            value,
          )
        ? "ai"
        : tags.length ||
            /\b(developer|programming|software|release|open.source)\b/i.test(
              value,
            )
          ? "developers"
          : "technology");
  return { category, technologies: tags };
}
export function ranking(item: Item, credibility: number, now = new Date()) {
  const age = item.publishedAt
    ? Math.max(0, (now.getTime() - Date.parse(item.publishedAt)) / 3600000)
    : 168;
  const recency = Math.max(0, 30 - age / 4);
  const impact =
    item.vulnerability?.exploitation === "known exploited"
      ? 30
      : item.incident && item.incident.status !== "resolved"
        ? 15
        : 0;
  const community = Math.min(10, Math.log2(1 + (item.points ?? 0)));
  return {
    score:
      Math.round((credibility * 4 + recency + impact + community) * 10) / 10,
    reasons: [
      `Source weight: ${credibility * 4}`,
      `Recency: ${recency.toFixed(1)}`,
      `Documented impact: ${impact}`,
      `Community interest: ${community.toFixed(1)}`,
    ],
  };
}
