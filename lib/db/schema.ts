import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
  real,
} from "drizzle-orm/pg-core";
import type { Vulnerability, Incident } from "../types";
const date = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });
export const sources = pgTable("sources", {
  id: text().primaryKey(),
  name: text().notNull(),
  kind: text().notNull(),
  url: text().notNull(),
  endpoint: text().notNull(),
  docs: text().notNull(),
  enabled: boolean().notNull().default(true),
  credibility: integer().notNull(),
  intervalMinutes: integer("interval_minutes").notNull(),
  note: text().notNull(),
  lastAttempt: date("last_attempt"),
  lastSuccess: date("last_success"),
  nextAllowedAt: date("next_allowed_at"),
  lastError: text("last_error"),
  etag: text(),
  lastModified: text("last_modified"),
  cursor: text(),
  failures: integer().notNull().default(0),
});
export const categories = pgTable("categories", {
  id: text().primaryKey(),
  name: text().notNull(),
});
export const technologies = pgTable("technologies", {
  id: text().primaryKey(),
  name: text().notNull().unique(),
});
export const stories = pgTable(
  "stories",
  {
    id: text().primaryKey(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    normalizedTitle: text("normalized_title").notNull(),
    canonicalUrl: text("canonical_url").notNull().unique(),
    preview: text().notNull(),
    summaryMode: text("summary_mode").notNull().default("preview"),
    aiSummary: text("ai_summary"),
    aiSources: jsonb("ai_sources").$type<string[]>(),
    category: text()
      .notNull()
      .references(() => categories.id),
    publishedAt: date("published_at"),
    eventAt: date("event_at"),
    firstSeen: date("first_seen").notNull().defaultNow(),
    lastVerified: date("last_verified").notNull(),
    verification: text().notNull().default("reported"),
    rank: real().notNull().default(0),
    rankReasons: jsonb("rank_reasons").$type<string[]>().notNull(),
    technologyTags: jsonb("technology_tags").$type<string[]>().notNull(),
    sourceCount: integer("source_count").notNull().default(1),
    kind: text().notNull().default("news"),
  },
  (t) => [
    index("stories_published_idx").on(t.publishedAt),
    index("stories_category_idx").on(t.category),
    index("stories_rank_idx").on(t.rank),
  ],
);
export const sourceItems = pgTable(
  "source_items",
  {
    id: text().primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    externalId: text("external_id").notNull(),
    storyId: text("story_id").references(() => stories.id, {
      onDelete: "cascade",
    }),
    originalUrl: text("original_url").notNull(),
    title: text().notNull(),
    publishedAt: date("published_at"),
    eventAt: date("event_at"),
    lastVerified: date("last_verified").notNull(),
    status: text().notNull().default("processed"),
    metadata: jsonb()
      .$type<{ discussionUrl?: string; points?: number; comments?: number }>()
      .notNull(),
  },
  (t) => [
    uniqueIndex("source_external_unique").on(t.sourceId, t.externalId),
    index("source_items_story_idx").on(t.storyId),
  ],
);
export const storySources = pgTable(
  "story_sources",
  {
    storyId: text("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    sourceItemId: text("source_item_id")
      .notNull()
      .references(() => sourceItems.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.storyId, t.sourceItemId] })],
);
export const storyTechnologies = pgTable(
  "story_technologies",
  {
    storyId: text("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    technologyId: text("technology_id")
      .notNull()
      .references(() => technologies.id),
  },
  (t) => [primaryKey({ columns: [t.storyId, t.technologyId] })],
);
export const vulnerabilities = pgTable(
  "vulnerabilities",
  {
    storyId: text("story_id")
      .primaryKey()
      .references(() => stories.id, { onDelete: "cascade" }),
    identifier: text().notNull(),
    details: jsonb().$type<Vulnerability>().notNull(),
  },
  (t) => [index("vulnerability_identifier_idx").on(t.identifier)],
);
export const serviceIncidents = pgTable(
  "service_incidents",
  {
    storyId: text("story_id")
      .primaryKey()
      .references(() => stories.id, { onDelete: "cascade" }),
    provider: text().notNull(),
    status: text().notNull(),
    details: jsonb().$type<Incident>().notNull(),
  },
  (t) => [index("incident_status_idx").on(t.status)],
);
export const ingestionRuns = pgTable(
  "ingestion_runs",
  {
    id: text().primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    startedAt: date("started_at").notNull(),
    finishedAt: date("finished_at"),
    status: text().notNull(),
    items: integer().notNull().default(0),
    error: text(),
  },
  (t) => [index("runs_started_idx").on(t.startedAt)],
);
export const userPreferences = pgTable("user_preferences", {
  id: text().primaryKey(),
  preferences: jsonb().notNull(),
  updatedAt: date("updated_at").notNull().defaultNow(),
});
export const bookmarks = pgTable(
  "bookmarks",
  {
    preferenceId: text("preference_id")
      .notNull()
      .references(() => userPreferences.id, { onDelete: "cascade" }),
    storyId: text("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    createdAt: date("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.preferenceId, t.storyId] })],
);
export type Story = typeof stories.$inferSelect;
export type Source = typeof sources.$inferSelect;
