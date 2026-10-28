import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  getTableColumns,
} from "drizzle-orm";
import type { Attribution } from "./editorial";
import { unstable_cache } from "next/cache";
import { db } from "./db";
import * as t from "./db/schema";
import { sourceRegistry } from "./ingestion/sources";
export type Filters = {
  category?: string;
  kind?: string;
  query?: string;
  technology?: string;
  technologies?: string[];
  ids?: string[];
  source?: string;
  page?: number;
  order?: "rank" | "latest";
  since?: Date;
};
export async function storyList(f: Filters = {}) {
  const page = Math.max(1, Math.min(1000, Math.floor(f.page ?? 1)));
  try {
    const conditions = [];
    if (f.category) conditions.push(eq(t.stories.category, f.category));
    if (f.kind) conditions.push(eq(t.stories.kind, f.kind));
    if (f.query) {
      const q = `%${f.query.slice(0, 150).replace(/[\\%_]/g, "\\$&")}%`;
      conditions.push(
        or(ilike(t.stories.title, q), ilike(t.stories.preview, q)),
      );
    }
    if (f.technology)
      conditions.push(
        sql`${t.stories.technologyTags} @> ${JSON.stringify([f.technology])}::jsonb`,
      );
    if (f.technologies)
      conditions.push(
        f.technologies.length
          ? or(
              ...f.technologies
                .slice(0, 12)
                .map(
                  (tag) =>
                    sql`${t.stories.technologyTags} @> ${JSON.stringify([tag])}::jsonb`,
                ),
            )
          : sql`false`,
      );
    if (f.ids)
      conditions.push(
        f.ids.length ? inArray(t.stories.id, f.ids.slice(0, 100)) : sql`false`,
      );
    if (f.source)
      conditions.push(
        sql`exists(select 1 from source_items si where si.story_id=${t.stories.id} and si.source_id=${f.source})`,
      );
    if (f.since)
      conditions.push(
        sql`coalesce(${t.stories.publishedAt},${t.stories.eventAt},${t.stories.firstSeen}) >= ${f.since.toISOString()}::timestamptz`,
      );
    const where = and(...conditions);
    const effective = sql`coalesce(${t.stories.publishedAt},${t.stories.eventAt},${t.stories.firstSeen})`;
    const order =
      f.order === "rank"
        ? sql`${t.stories.rank} - least(80, greatest(0, extract(epoch from (now() - ${effective}))/86400))`
        : effective;
    const [rows, total] = await Promise.all([
      db()
        .select({
          ...getTableColumns(t.stories),
          attribution: sql<
            Attribution[]
          >`coalesce((select jsonb_agg(distinct jsonb_build_object('name', so.name, 'url', si.original_url)) from source_items si join sources so on so.id=si.source_id where si.story_id=stories.id), '[]'::jsonb)`,
        })
        .from(t.stories)
        .where(where)
        .orderBy(desc(order), desc(t.stories.id))
        .limit(24)
        .offset((page - 1) * 24),
      db()
        .select({ count: sql<number>`count(*)::integer` })
        .from(t.stories)
        .where(where),
    ]);
    return {
      rows,
      total: total[0]?.count ?? 0,
      page,
      error: null as string | null,
    };
  } catch (error) {
    console.error(
      "Story query failed",
      error instanceof Error && error.cause instanceof Error
        ? error.cause.message
        : "Unknown database error",
    );
    return {
      rows: [],
      total: 0,
      page,
      error:
        "The intelligence database is unavailable. Stored news will return when the connection is restored.",
    };
  }
}
export const sourceHealth = unstable_cache(
  async () => {
    try {
      return await db().select().from(t.sources).orderBy(t.sources.name);
    } catch {
      return sourceRegistry().map((s) => ({
        ...s,
        lastAttempt: null,
        lastSuccess: null,
        nextAllowedAt: null,
        lastError: "Database connection unavailable",
        etag: null,
        lastModified: null,
        cursor: null,
        failures: 0,
      }));
    }
  },
  ["source-health"],
  { revalidate: 60, tags: ["intelligence"] },
);
export const overview = unstable_cache(
  async () => {
    const [
      news,
      security,
      developer,
      community,
      advisories,
      incidents,
      sources,
    ] = await Promise.all([
      storyList({ kind: "news", order: "rank" }),
      storyList({ category: "security", kind: "news", order: "latest" }),
      storyList({ category: "developers", kind: "news", order: "latest" }),
      storyList({ category: "community", order: "rank" }),
      vulnerabilityList(),
      incidentList(),
      sourceHealth(),
    ]);
    return {
      news,
      security,
      developer,
      community,
      advisories,
      incidents,
      sources,
    };
  },
  ["overview"],
  { revalidate: 120, tags: ["intelligence"] },
);
export async function vulnerabilityList(query = "", page = 1, severity = "") {
  try {
    const conditions = [];
    if (query)
      conditions.push(
        or(
          ilike(
            t.vulnerabilities.identifier,
            `%${query.replace(/[\\%_]/g, "\\$&")}%`,
          ),
          ilike(t.stories.title, `%${query.replace(/[\\%_]/g, "\\$&")}%`),
        ),
      );
    if (severity)
      conditions.push(
        sql`lower(${t.vulnerabilities.details}->>'severity')=${severity}`,
      );
    return await db()
      .select({ story: t.stories, record: t.vulnerabilities })
      .from(t.vulnerabilities)
      .innerJoin(t.stories, eq(t.stories.id, t.vulnerabilities.storyId))
      .where(and(...conditions))
      .orderBy(
        desc(sql`coalesce(${t.stories.publishedAt},${t.stories.eventAt})`),
      )
      .limit(25)
      .offset((Math.max(1, page) - 1) * 25);
  } catch {
    throw new Error("Advisory database unavailable");
  }
}
export async function incidentList() {
  try {
    return await db()
      .select({ story: t.stories, record: t.serviceIncidents })
      .from(t.serviceIncidents)
      .innerJoin(t.stories, eq(t.stories.id, t.serviceIncidents.storyId))
      .orderBy(
        sql`case when ${t.serviceIncidents.status}='resolved' then 1 else 0 end`,
        desc(sql`${t.serviceIncidents.details}->>'updatedAt'`),
      )
      .limit(100);
  } catch {
    throw new Error("Incident database unavailable");
  }
}
export async function storyDetail(slug: string) {
  try {
    const [story] = await db()
      .select()
      .from(t.stories)
      .where(eq(t.stories.slug, slug))
      .limit(1);
    if (!story) return null;
    const [sources, vulnerabilities, incidents] = await Promise.all([
      db()
        .select({ item: t.sourceItems, source: t.sources })
        .from(t.sourceItems)
        .innerJoin(t.sources, eq(t.sources.id, t.sourceItems.sourceId))
        .where(eq(t.sourceItems.storyId, story.id)),
      db()
        .select()
        .from(t.vulnerabilities)
        .where(eq(t.vulnerabilities.storyId, story.id)),
      db()
        .select()
        .from(t.serviceIncidents)
        .where(eq(t.serviceIncidents.storyId, story.id)),
    ]);
    return {
      story,
      sources,
      vulnerability: vulnerabilities[0],
      incident: incidents[0],
    };
  } catch {
    throw new Error("Story database unavailable");
  }
}
export async function bookmarked(ids: string[]) {
  if (!ids.length) return [];
  return db()
    .select()
    .from(t.stories)
    .where(inArray(t.stories.id, ids.slice(0, 100)))
    .limit(100);
}
export function sourceState(s: {
  enabled: boolean;
  lastSuccess: Date | null;
  lastError: string | null;
  intervalMinutes: number;
}) {
  if (!s.enabled) return "disabled";
  if (s.lastError) return "unavailable";
  if (!s.lastSuccess) return "awaiting sync";
  return Date.now() - new Date(s.lastSuccess).getTime() >
    s.intervalMinutes * 60000 * 2
    ? "stale"
    : "current";
}
export function stamp(date: Date | string | null | undefined) {
  if (!date) return "Not supplied";
  return (
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(date)) + " UTC"
  );
}
