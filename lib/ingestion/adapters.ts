import Parser from "rss-parser";
import { json, mapLimit, request } from "./http";
import { plain, preview, safeUrl, validDate } from "../processing";
import type {
  AdapterResult,
  Item,
  SourceContext,
  SourceDefinition,
  Incident,
} from "../types";
const parser = new Parser();
const date = (v: unknown) => validDate(v);
const state = (v: string): Incident["status"] =>
  v === "postmortem"
    ? "resolved"
    : ["investigating", "identified", "monitoring", "resolved"].includes(v)
      ? (v as Incident["status"])
      : "unknown";
type GH = {
  ghsa_id: string;
  cve_id: string | null;
  summary: string;
  html_url: string;
  published_at: string;
  updated_at: string;
  withdrawn_at: string | null;
  severity: string;
  cvss?: { score: number };
  cvss_severities?: {
    cvss_v3?: { score: number };
    cvss_v4?: { score: number };
  };
  vulnerabilities: {
    package: { name: string; ecosystem: string };
    vulnerable_version_range: string;
    first_patched_version: string | null;
  }[];
  references: string[];
};
async function hackerNews(s: SourceDefinition): Promise<AdapterResult> {
  const lists = await Promise.all(
    ["top", "new", "best"].map((kind) =>
      json<number[]>(`${s.endpoint}/${kind}stories.json`),
    ),
  );
  const ids = [...new Set(lists.flatMap((list) => list.slice(0, 18)))];
  const rows = await mapLimit(ids, 4, async (id) => {
    try {
      return await json<{
        id: number;
        title: string;
        url?: string;
        time: number;
        score: number;
        descendants?: number;
        deleted?: boolean;
        dead?: boolean;
        type: string;
      }>(`${s.endpoint}/item/${id}.json`);
    } catch {
      return null;
    }
  });
  if (!rows.some(Boolean)) throw new Error("All HN item requests failed");
  return {
    items: rows
      .filter(
        (v) => v && !v.deleted && !v.dead && v.type === "story" && v.title,
      )
      .map((v) => ({
        externalId: String(v!.id),
        title: plain(v!.title),
        url: v!.url ?? `https://news.ycombinator.com/item?id=${v!.id}`,
        publishedAt: date(new Date(v!.time * 1000).toISOString()),
        discussionUrl: `https://news.ycombinator.com/item?id=${v!.id}`,
        points: v!.score,
        comments: v!.descendants,
        category: "community",
      })),
  };
}
async function dev(s: SourceDefinition): Promise<AdapterResult> {
  const rows = await json<
    {
      id: number;
      title: string;
      url: string;
      published_at: string;
      description: string;
      tag_list: string[];
    }[]
  >(`${s.endpoint}?per_page=30&page=1&top=1`);
  return {
    items: rows.map((v) => ({
      externalId: String(v.id),
      title: v.title,
      url: v.url,
      publishedAt: date(v.published_at),
      preview: preview(v.description),
      category: "developers",
    })),
  };
}
async function kev(
  s: SourceDefinition,
  c: SourceContext,
): Promise<AdapterResult> {
  const response = await request(s.endpoint, {
    headers: c.etag ? { "If-None-Match": c.etag } : {},
  });
  if (response.status === 304) return { items: [], notModified: true };
  const data = (await response.json()) as {
    vulnerabilities: {
      cveID: string;
      vulnerabilityName: string;
      vendorProject: string;
      product: string;
      dateAdded: string;
      shortDescription: string;
      requiredAction: string;
      notes: string;
    }[];
  };
  if (!Array.isArray(data.vulnerabilities))
    throw new Error("Invalid KEV catalog");
  return {
    etag: response.headers.get("etag"),
    items: data.vulnerabilities.map((v) => ({
      externalId: v.cveID,
      title: v.vulnerabilityName,
      url: `https://www.cisa.gov/known-exploited-vulnerabilities-catalog?field_cve=${encodeURIComponent(v.cveID)}`,
      publishedAt: null,
      eventAt: date(v.dateAdded),
      preview: preview(v.shortDescription),
      category: "security",
      vulnerability: {
        identifiers: [v.cveID],
        severity: null,
        cvss: null,
        affected: [{ product: `${v.vendorProject} ${v.product}` }],
        exploitation: "known exploited",
        action: v.requiredAction,
        references: [...(v.notes?.match(/https?:\/\/[^\s;]+/g) ?? [])].filter(
          (u) => safeUrl(u) !== null,
        ),
      },
    })),
  };
}
async function github(
  s: SourceDefinition,
  c: SourceContext,
): Promise<AdapterResult> {
  const items: Item[] = [];
  let cursor = c.cursor;
  let continuation: string | undefined;
  if (cursor?.startsWith("{")) {
    const saved = JSON.parse(cursor) as { updated: string; next: string };
    cursor = saved.updated;
    const next = new URL(saved.next);
    if (
      next.origin !== new URL(s.endpoint).origin ||
      next.pathname !== new URL(s.endpoint).pathname
    )
      throw new Error("Invalid advisory continuation");
    continuation = next.href;
  }
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const since = (
    cursor
      ? new Date(Math.max(0, Date.parse(cursor) - 1000))
      : new Date(Date.now() - 14 * 86400000)
  )
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");
  let nextUrl: string | undefined =
    continuation ??
    `${s.endpoint}?type=reviewed&sort=updated&direction=asc&per_page=100&updated=${encodeURIComponent(">=" + since)}`;
  for (let page = 1; page <= 3 && nextUrl; page++) {
    const response = await request(nextUrl, { headers });
    const body = await response.text();
    if (body.length > 15_000_000)
      throw new Error("Source response exceeds size limit");
    const rows = JSON.parse(body) as GH[];
    const nextLink = response.headers
      .get("link")
      ?.split(",")
      .find((part) => /rel="next"/.test(part))
      ?.match(/<([^>]+)>/)?.[1];
    nextUrl = undefined;
    if (nextLink) {
      const next = new URL(nextLink);
      if (
        next.origin !== new URL(s.endpoint).origin ||
        next.pathname !== new URL(s.endpoint).pathname
      )
        throw new Error("Invalid advisory pagination URL");
      nextUrl = next.href;
    }
    if (!Array.isArray(rows))
      throw new Error("Invalid GitHub advisory response");
    for (const v of rows) {
      items.push({
        externalId: v.ghsa_id,
        title: v.summary,
        url: v.html_url,
        publishedAt: date(v.published_at),
        eventAt: date(v.updated_at),
        category: "security",
        vulnerability: {
          identifiers: [v.ghsa_id, ...(v.cve_id ? [v.cve_id] : [])],
          severity: v.severity ?? null,
          cvss:
            v.cvss_severities?.cvss_v4?.score ??
            v.cvss_severities?.cvss_v3?.score ??
            v.cvss?.score ??
            null,
          affected: (v.vulnerabilities ?? []).map((p) => ({
            product: p.package.name,
            ecosystem: p.package.ecosystem,
            versions: p.vulnerable_version_range,
            fixed: p.first_patched_version ?? undefined,
          })),
          exploitation: "unknown",
          action: null,
          references: (v.references ?? []).filter((r) => safeUrl(r) !== null),
          withdrawn: Boolean(v.withdrawn_at),
        },
      });
      if (!cursor || v.updated_at > cursor) cursor = v.updated_at;
    }
  }
  return {
    items,
    cursor: nextUrl
      ? JSON.stringify({ updated: cursor ?? since, next: nextUrl })
      : (cursor ?? undefined),
  };
}
type OSV = {
  id: string;
  aliases?: string[];
  summary?: string;
  published?: string;
  modified: string;
  withdrawn?: string;
  database_specific?: { severity?: string };
  severity?: { type: string; score: string }[];
  affected?: {
    package: { name: string; ecosystem: string };
    versions?: string[];
    ranges?: {
      events: { introduced?: string; fixed?: string; last_affected?: string }[];
    }[];
  }[];
  references?: { url: string }[];
};
async function osv(): Promise<AdapterResult> {
  const packages = [
    { name: "next", ecosystem: "npm" },
    { name: "react", ecosystem: "npm" },
    { name: "django", ecosystem: "PyPI" },
    { name: "laravel/framework", ecosystem: "Packagist" },
  ];
  const all: OSV[] = [];
  for (const p of packages) {
    let next: string | undefined;
    for (let page = 0; page < 4; page++) {
      const data = await json<{ vulns?: OSV[]; next_page_token?: string }>(
        "https://api.osv.dev/v1/query",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ package: p, page_token: next }),
        },
      );
      all.push(...(data.vulns ?? []));
      next = data.next_page_token;
      if (!next) break;
      if (page === 3)
        throw new Error(
          "OSV page budget reached; narrow package scope before retrying",
        );
    }
  }
  return {
    items: [...new Map(all.map((v) => [v.id, v])).values()].map((v) => ({
      externalId: v.id,
      title: v.summary ?? v.id,
      url: `https://osv.dev/vulnerability/${encodeURIComponent(v.id)}`,
      publishedAt: date(v.published),
      eventAt: date(v.modified),
      category: "security",
      vulnerability: {
        identifiers: [v.id, ...(v.aliases ?? [])],
        severity: v.database_specific?.severity ?? null,
        cvss: null,
        affected: (v.affected ?? []).map((a) => ({
          product: a.package.name,
          ecosystem: a.package.ecosystem,
          versions:
            a.ranges
              ?.map((r) =>
                r.events
                  .map((e) =>
                    e.introduced
                      ? `introduced ${e.introduced}`
                      : e.fixed
                        ? `fixed ${e.fixed}`
                        : e.last_affected
                          ? `last affected ${e.last_affected}`
                          : "",
                  )
                  .join("; "),
              )
              .join(" | ") || a.versions?.slice(0, 20).join(", "),
          fixed: a.ranges
            ?.flatMap((r) =>
              r.events.filter((e) => e.fixed).map((e) => e.fixed),
            )
            .join(", "),
        })),
        exploitation: "unknown",
        action: null,
        references: (v.references ?? [])
          .map((r) => r.url)
          .filter((r) => safeUrl(r) !== null),
        withdrawn: Boolean(v.withdrawn),
      },
    })),
  };
}
async function rss(
  s: SourceDefinition,
  c: SourceContext,
): Promise<AdapterResult> {
  const headers: Record<string, string> = {};
  if (c.etag) headers["If-None-Match"] = c.etag;
  if (c.lastModified) headers["If-Modified-Since"] = c.lastModified;
  const r = await request(s.endpoint, { headers });
  if (r.status === 304) return { items: [], notModified: true };
  const text = await r.text();
  if (text.length > 5_000_000) throw new Error("Feed too large");
  const feed = await parser.parseString(text);
  return {
    etag: r.headers.get("etag"),
    lastModified: r.headers.get("last-modified"),
    items: feed.items
      .slice(0, 40)
      .filter((v) => v.title && v.link)
      .map((v) => ({
        externalId: v.guid ?? v.id ?? v.link!,
        title: plain(v.title!),
        url: v.link!,
        publishedAt: date(v.isoDate ?? v.pubDate),
        preview:
          process.env.RSS_EXCERPTS === "true"
            ? preview(v.contentSnippet ?? v.summary)
            : undefined,
        category: ["krebs", "bleeping"].includes(s.id) ? "security" : undefined,
      })),
  };
}
type StatusRow = {
  id: string;
  name: string;
  status: string;
  shortlink: string;
  created_at: string;
  started_at?: string;
  updated_at: string;
  resolved_at?: string;
  components?: { name: string }[];
  incident_updates?: { body: string; created_at: string; status: string }[];
};
async function statuspage(s: SourceDefinition): Promise<AdapterResult> {
  const history = await json<{ incidents: StatusRow[] }>(s.endpoint);
  const unresolved = await json<{ incidents: StatusRow[] }>(
    `${s.url}/api/v2/incidents/unresolved.json`,
  );
  if (!Array.isArray(history.incidents) || !Array.isArray(unresolved.incidents))
    throw new Error("Invalid official incident response");
  const body = {
    incidents: [
      ...new Map(
        [...history.incidents, ...unresolved.incidents].map((i) => [i.id, i]),
      ).values(),
    ],
  };
  if (!Array.isArray(body.incidents))
    throw new Error("Invalid official incident response");
  return {
    items: body.incidents.map((v) => ({
      externalId: v.id,
      title: v.name,
      url:
        safeUrl(v.shortlink) ??
        `${s.url}/incidents/${encodeURIComponent(v.id)}`,
      publishedAt: date(v.created_at),
      incident: {
        provider: s.name,
        services: v.components?.map((c) => c.name) ?? [],
        status: state(v.status),
        startedAt: date(v.started_at ?? v.created_at),
        updatedAt: date(v.updated_at),
        resolvedAt: date(v.resolved_at),
        update: preview(v.incident_updates?.[0]?.body) || null,
      },
    })),
  };
}
async function google(s: SourceDefinition): Promise<AdapterResult> {
  const rows = await json<
    {
      id: string;
      external_desc: string;
      uri: string;
      begin: string;
      end?: string;
      modified: string;
      affected_products?: { title: string }[];
      most_recent_update?: { text: string; status: string; when: string };
    }[]
  >(s.endpoint);
  if (!Array.isArray(rows)) throw new Error("Invalid Google status response");
  return {
    items: rows.slice(0, 100).map((v) => ({
      externalId: v.id,
      title: v.external_desc,
      url: new URL(v.uri, s.url).toString(),
      publishedAt: date(v.begin),
      incident: {
        provider: s.name,
        services: v.affected_products?.map((p) => p.title) ?? [],
        status: v.end
          ? "resolved"
          : v.most_recent_update?.status === "AVAILABLE"
            ? "resolved"
            : "investigating",
        startedAt: date(v.begin),
        updatedAt: date(v.modified ?? v.most_recent_update?.when),
        resolvedAt: date(v.end),
        update: preview(v.most_recent_update?.text) || null,
      },
    })),
  };
}
async function aws(
  s: SourceDefinition,
  c: SourceContext,
): Promise<AdapterResult> {
  const url = new URL(s.endpoint);
  if (
    !["status.aws.amazon.com", "health.aws.amazon.com"].includes(
      url.hostname,
    ) ||
    url.protocol !== "https:"
  )
    throw new Error("AWS feed must use an official HTTPS hostname");
  const result = await rss(s, c);
  return {
    ...result,
    items: result.items.map((i) => ({
      ...i,
      incident: {
        provider: "AWS",
        services: [],
        status: "unknown",
        startedAt: null,
        updatedAt: i.publishedAt,
        resolvedAt: null,
        update:
          "See official feed. Incident state is not inferred from free text.",
      },
    })),
  };
}
export async function fetchSource(
  s: SourceDefinition,
  c: SourceContext,
): Promise<AdapterResult> {
  switch (s.adapter) {
    case "hn":
      return hackerNews(s);
    case "dev":
      return dev(s);
    case "kev":
      return kev(s, c);
    case "github":
      return github(s, c);
    case "osv":
      return osv();
    case "rss":
      return rss(s, c);
    case "statuspage":
      return statuspage(s);
    case "google":
      return google(s);
    case "aws":
      return aws(s, c);
    default:
      throw new Error("Optional integration is not configured");
  }
}
export type PermittedOptionalAdapter = {
  source: SourceDefinition;
  fetch: (context: SourceContext) => Promise<AdapterResult>;
};
export function validateOptionalAdapter(adapter: PermittedOptionalAdapter) {
  if (!adapter.source.docs || !safeUrl(adapter.source.endpoint))
    throw new Error("Documented API and valid endpoint are required");
  return adapter;
}
