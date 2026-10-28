import { randomUUID, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, sqlClient } from "../db";
import * as t from "../db/schema";
import {
  canonicalUrl,
  classify,
  hash,
  normalizedTitle,
  plain,
  preview,
  ranking,
  safeUrl,
  sameStory,
  validDate,
} from "../processing";
import {
  technologyNames,
  type Item,
  type SourceDefinition,
  type Vulnerability,
} from "../types";
import { sourceRegistry } from "./sources";
import { fetchSource } from "./adapters";
import { optionalSummary } from "./ai";
import { HttpError } from "./http";
export function authenticated(
  header: string | null,
  secret = process.env.INGEST_SECRET,
) {
  if (!secret || secret.length < 32 || !header?.startsWith("Bearer "))
    return false;
  const supplied = Buffer.from(header.slice(7)),
    expected = Buffer.from(secret);
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}
export function mergeVulnerability(
  old: Vulnerability | undefined,
  next: Vulnerability,
): Vulnerability {
  if (!old) return next;
  return {
    ...next,
    identifiers: [...new Set([...old.identifiers, ...next.identifiers])],
    severity: next.severity ?? old.severity,
    cvss: next.cvss ?? old.cvss,
    affected: [
      ...new Map(
        [...old.affected, ...next.affected].map((a) => [
          `${a.product}:${a.versions ?? ""}`,
          a,
        ]),
      ).values(),
    ],
    exploitation:
      old.exploitation === "known exploited" ||
      next.exploitation === "known exploited"
        ? "known exploited"
        : "unknown",
    action: next.action ?? old.action,
    references: [...new Set([...old.references, ...next.references])],
    withdrawn: next.withdrawn ?? old.withdrawn,
  };
}
export async function registerSources() {
  const database = db();
  for (const category of [
    "technology",
    "security",
    "developers",
    "ai",
    "community",
  ])
    await database
      .insert(t.categories)
      .values({ id: category, name: category })
      .onConflictDoNothing();
  for (const name of technologyNames)
    await database
      .insert(t.technologies)
      .values({ id: name, name })
      .onConflictDoNothing();
  for (const s of sourceRegistry()) {
    const record = {
      id: s.id,
      name: s.name,
      kind: s.kind,
      url: s.url,
      endpoint: s.endpoint,
      docs: s.docs,
      enabled: s.enabled,
      credibility: s.credibility,
      intervalMinutes: s.intervalMinutes,
      note: s.note,
    };
    await database
      .insert(t.sources)
      .values(record)
      .onConflictDoUpdate({ target: t.sources.id, set: record });
  }
}
export async function persistItems(
  source: SourceDefinition,
  items: Item[],
  now = new Date(),
) {
  const database = db();
  let count = 0;
  const existing = await database.select().from(t.stories);
  const vulnerabilityRows = await database.select().from(t.vulnerabilities);
  const aliases = new Map<string, string>();
  const details = new Map<string, Vulnerability>();
  for (const row of vulnerabilityRows) {
    details.set(row.storyId, row.details);
    for (const id of row.details.identifiers) aliases.set(id, row.storyId);
  }
  const canonical = new Map(existing.map((s) => [s.canonicalUrl, s]));
  const byId = new Map(existing.map((s) => [s.id, s]));
  await database.transaction(async (tx) => {
    for (const raw of items) {
      if (!raw.title || !safeUrl(raw.url)) continue;
      const item = {
        ...raw,
        title: plain(raw.title).slice(0, 500),
        publishedAt: validDate(raw.publishedAt),
        eventAt: validDate(raw.eventAt),
        preview: preview(raw.preview),
      };
      const url = canonicalUrl(item.url);
      const kind = item.vulnerability
        ? "vulnerability"
        : item.incident
          ? "incident"
          : "news";
      const itemId = hash(`${source.id}:${item.externalId}`);
      const [prior] = await tx
        .select()
        .from(t.sourceItems)
        .where(eq(t.sourceItems.id, itemId))
        .limit(1);
      let story = prior?.storyId ? byId.get(prior.storyId) : canonical.get(url);
      if (!story && item.vulnerability) {
        const match = item.vulnerability.identifiers
          .map((id) => aliases.get(id))
          .find(Boolean);
        if (match) story = byId.get(match);
      }
      if (!story && kind === "news")
        story = existing.find(
          (s) =>
            s.kind === "news" &&
            sameStory(
              {
                title: s.title,
                publishedAt: s.publishedAt?.toISOString() ?? null,
              },
              item,
            ),
        );
      const id = story?.id ?? hash(url);
      const { category, technologies } = classify(item);
      const rank = ranking(item, source.credibility, now);
      const tags = [
        ...new Set([...(story?.technologyTags ?? []), ...technologies]),
      ];
      const record = {
        id,
        slug:
          story?.slug ??
          `${normalizedTitle(item.title)
            .replace(/[^a-z0-9]+/g, "-")
            .slice(0, 75)}-${id.slice(0, 10)}`,
        title: story?.title ?? item.title,
        normalizedTitle: normalizedTitle(story?.title ?? item.title),
        canonicalUrl: story?.canonicalUrl ?? url,
        preview: story?.preview || item.preview || "",
        summaryMode: "preview",
        category: item.vulnerability
          ? "security"
          : (story?.category ?? category),
        publishedAt:
          story?.publishedAt ??
          (item.publishedAt ? new Date(item.publishedAt) : null),
        eventAt: item.eventAt
          ? new Date(item.eventAt)
          : (story?.eventAt ?? null),
        lastVerified: now,
        verification:
          kind === "incident"
            ? "provider-reported"
            : item.vulnerability
              ? "official advisory"
              : "reported",
        rank: Math.max(story?.rank ?? 0, rank.score),
        rankReasons:
          story && story.rank > rank.score ? story.rankReasons : rank.reasons,
        technologyTags: tags,
        kind,
      };
      const [saved] = await tx
        .insert(t.stories)
        .values(record)
        .onConflictDoUpdate({ target: t.stories.id, set: record })
        .returning();
      byId.set(id, saved);
      canonical.set(url, saved);
      if (!story) existing.push(saved);
      await tx
        .insert(t.sourceItems)
        .values({
          id: itemId,
          sourceId: source.id,
          externalId: item.externalId,
          storyId: id,
          originalUrl: item.url,
          title: item.title,
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
          eventAt: item.eventAt ? new Date(item.eventAt) : null,
          lastVerified: now,
          status: "processed",
          metadata: {
            discussionUrl: item.discussionUrl,
            points: item.points,
            comments: item.comments,
          },
        })
        .onConflictDoUpdate({
          target: t.sourceItems.id,
          set: {
            lastVerified: now,
            title: item.title,
            metadata: {
              discussionUrl: item.discussionUrl,
              points: item.points,
              comments: item.comments,
            },
            eventAt: item.eventAt ? new Date(item.eventAt) : null,
          },
        });
      await tx
        .insert(t.storySources)
        .values({ storyId: id, sourceItemId: itemId })
        .onConflictDoNothing();
      for (const tag of tags)
        await tx
          .insert(t.storyTechnologies)
          .values({ storyId: id, technologyId: tag })
          .onConflictDoNothing();
      if (item.vulnerability) {
        const merged = mergeVulnerability(details.get(id), item.vulnerability);
        merged.references = [...new Set([...merged.references, item.url])];
        await tx
          .insert(t.vulnerabilities)
          .values({
            storyId: id,
            identifier:
              merged.identifiers.find((i) => i.startsWith("CVE-")) ??
              merged.identifiers[0],
            details: merged,
          })
          .onConflictDoUpdate({
            target: t.vulnerabilities.storyId,
            set: { details: merged },
          });
        details.set(id, merged);
        for (const alias of merged.identifiers) aliases.set(alias, id);
      }
      if (item.incident)
        await tx
          .insert(t.serviceIncidents)
          .values({
            storyId: id,
            provider: item.incident.provider,
            status: item.incident.status,
            details: item.incident,
          })
          .onConflictDoUpdate({
            target: t.serviceIncidents.storyId,
            set: { status: item.incident.status, details: item.incident },
          });
      count++;
    }
    // A missing record is not a resolution. Keep its last known report but mark state unknown.
    if (
      source.kind === "status" &&
      (items.length || ["statuspage", "google"].includes(source.adapter))
    ) {
      const seen = items.map((i) => hash(`${source.id}:${i.externalId}`));
      const previous = await tx
        .select({ item: t.sourceItems, incident: t.serviceIncidents })
        .from(t.sourceItems)
        .innerJoin(
          t.serviceIncidents,
          eq(t.sourceItems.storyId, t.serviceIncidents.storyId),
        )
        .where(eq(t.sourceItems.sourceId, source.id));
      for (const row of previous)
        if (!seen.includes(row.item.id) && row.incident.status !== "resolved") {
          await tx
            .update(t.serviceIncidents)
            .set({
              status: "unknown",
              details: { ...row.incident.details, status: "unknown" },
            })
            .where(eq(t.serviceIncidents.storyId, row.incident.storyId));
        }
    }
    await tx.execute(
      sql`update stories set source_count=(select count(distinct source_id) from source_items where source_items.story_id=stories.id)`,
    );
  });
  // Optional summaries are bounded and cannot roll back ingestion or alter verification.
  if (process.env.ENABLE_AI === "true") {
    for (const item of items
      .filter((i) => i.preview && !i.vulnerability && !i.incident)
      .slice(0, 3)) {
      try {
        const story = canonical.get(canonicalUrl(item.url));
        if (!story || story.aiSummary) continue;
        const summary = await optionalSummary(item);
        if (summary)
          await database
            .update(t.stories)
            .set({ aiSummary: summary, aiSources: [item.url] })
            .where(eq(t.stories.id, story.id));
      } catch {
        console.warn(
          "Optional AI summary unavailable; keeping source preview.",
        );
      }
    }
  }
  return count;
}
export async function isolate<T>(tasks: (() => Promise<T>)[]) {
  const results: PromiseSettledResult<T>[] = [];
  for (const task of tasks) {
    try {
      results.push({ status: "fulfilled", value: await task() });
    } catch (reason) {
      results.push({ status: "rejected", reason });
    }
  }
  return results;
}
export async function ingest(
  options: {
    force?: boolean;
    only?: string[];
    fetcher?: typeof fetchSource;
  } = {},
) {
  const client = sqlClient();
  const connection = await client.reserve();
  let acquired = false;
  try {
    const [lock] =
      await connection`select pg_try_advisory_lock(77209123) as acquired`;
    if (!lock.acquired)
      return { skipped: "Another ingestion is running", results: [] };
    acquired = true;
    await registerSources();
    const results: {
      source: string;
      status: string;
      items?: number;
      error?: string;
    }[] = [];
    for (const source of sourceRegistry().filter(
      (s) => s.enabled && (!options.only || options.only.includes(s.id)),
    )) {
      const [current] = await db()
        .select()
        .from(t.sources)
        .where(eq(t.sources.id, source.id));
      const delay =
        source.intervalMinutes * 60000 * Math.min(8, 2 ** current.failures);
      if (current.nextAllowedAt && current.nextAllowedAt.getTime() > Date.now())
        continue;
      if (
        !options.force &&
        current.lastAttempt &&
        Date.now() - current.lastAttempt.getTime() < delay
      )
        continue;
      const started = new Date(),
        runId = randomUUID();
      await db().insert(t.ingestionRuns).values({
        id: runId,
        sourceId: source.id,
        startedAt: started,
        status: "running",
      });
      await db()
        .update(t.sources)
        .set({ lastAttempt: started })
        .where(eq(t.sources.id, source.id));
      try {
        const response = await (options.fetcher ?? fetchSource)(source, {
          lastSuccess: current.lastSuccess,
          cursor: current.cursor,
          etag: current.etag,
          lastModified: current.lastModified,
        });
        const count = await persistItems(source, response.items, started);
        await db()
          .update(t.sources)
          .set({
            lastSuccess: new Date(),
            lastError: null,
            failures: 0,
            nextAllowedAt: null,
            etag: response.etag ?? current.etag,
            lastModified: response.lastModified ?? current.lastModified,
            cursor: response.cursor ?? current.cursor,
          })
          .where(eq(t.sources.id, source.id));
        await db()
          .update(t.ingestionRuns)
          .set({
            status: response.notModified ? "not-modified" : "success",
            finishedAt: new Date(),
            items: count,
          })
          .where(eq(t.ingestionRuns.id, runId));
        results.push({ source: source.id, status: "success", items: count });
        console.log(JSON.stringify(results.at(-1)));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown source failure";
        const sanitized = message
          .replace(/https?:\/\/\S+/g, "[upstream URL]")
          .slice(0, 300);
        await db()
          .update(t.sources)
          .set({
            lastError: sanitized,
            failures: current.failures + 1,
            nextAllowedAt:
              error instanceof HttpError && error.retryAfterMs > 0
                ? new Date(Date.now() + error.retryAfterMs)
                : null,
          })
          .where(eq(t.sources.id, source.id));
        await db()
          .update(t.ingestionRuns)
          .set({ status: "failed", finishedAt: new Date(), error: sanitized })
          .where(eq(t.ingestionRuns.id, runId));
        results.push({ source: source.id, status: "failed", error: sanitized });
        console.warn(JSON.stringify(results.at(-1)));
      }
    }
    await db().execute(
      sql`delete from ingestion_runs where started_at < now() - interval '30 days'`,
    );
    await db().execute(
      sql`delete from stories where kind='news' and first_seen < now() - interval '90 days'`,
    );
    return { results };
  } finally {
    if (acquired) await connection`select pg_advisory_unlock(77209123)`;
    connection.release();
  }
}
