CREATE TABLE "bookmarks" (
	"preference_id" text NOT NULL,
	"story_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarks_preference_id_story_id_pk" PRIMARY KEY("preference_id","story_id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text NOT NULL,
	"items" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "service_incidents" (
	"story_id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"details" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_items" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"external_id" text NOT NULL,
	"story_id" text,
	"original_url" text NOT NULL,
	"title" text NOT NULL,
	"published_at" timestamp with time zone,
	"event_at" timestamp with time zone,
	"last_verified" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'processed' NOT NULL,
	"metadata" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"endpoint" text NOT NULL,
	"docs" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"credibility" integer NOT NULL,
	"interval_minutes" integer NOT NULL,
	"note" text NOT NULL,
	"last_attempt" timestamp with time zone,
	"last_success" timestamp with time zone,
	"last_error" text,
	"etag" text,
	"last_modified" text,
	"cursor" text,
	"failures" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"normalized_title" text NOT NULL,
	"canonical_url" text NOT NULL,
	"preview" text NOT NULL,
	"summary_mode" text DEFAULT 'preview' NOT NULL,
	"ai_summary" text,
	"ai_sources" jsonb,
	"category" text NOT NULL,
	"published_at" timestamp with time zone,
	"event_at" timestamp with time zone,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_verified" timestamp with time zone NOT NULL,
	"verification" text DEFAULT 'reported' NOT NULL,
	"rank" real DEFAULT 0 NOT NULL,
	"rank_reasons" jsonb NOT NULL,
	"technology_tags" jsonb NOT NULL,
	"source_count" integer DEFAULT 1 NOT NULL,
	"kind" text DEFAULT 'news' NOT NULL,
	CONSTRAINT "stories_slug_unique" UNIQUE("slug"),
	CONSTRAINT "stories_canonical_url_unique" UNIQUE("canonical_url")
);
--> statement-breakpoint
CREATE TABLE "story_sources" (
	"story_id" text NOT NULL,
	"source_item_id" text NOT NULL,
	CONSTRAINT "story_sources_story_id_source_item_id_pk" PRIMARY KEY("story_id","source_item_id")
);
--> statement-breakpoint
CREATE TABLE "story_technologies" (
	"story_id" text NOT NULL,
	"technology_id" text NOT NULL,
	CONSTRAINT "story_technologies_story_id_technology_id_pk" PRIMARY KEY("story_id","technology_id")
);
--> statement-breakpoint
CREATE TABLE "technologies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "technologies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"preferences" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vulnerabilities" (
	"story_id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"details" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_preference_id_user_preferences_id_fk" FOREIGN KEY ("preference_id") REFERENCES "public"."user_preferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_incidents" ADD CONSTRAINT "service_incidents_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_items" ADD CONSTRAINT "source_items_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_items" ADD CONSTRAINT "source_items_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_category_categories_id_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_sources" ADD CONSTRAINT "story_sources_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_sources" ADD CONSTRAINT "story_sources_source_item_id_source_items_id_fk" FOREIGN KEY ("source_item_id") REFERENCES "public"."source_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_technologies" ADD CONSTRAINT "story_technologies_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_technologies" ADD CONSTRAINT "story_technologies_technology_id_technologies_id_fk" FOREIGN KEY ("technology_id") REFERENCES "public"."technologies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vulnerabilities" ADD CONSTRAINT "vulnerabilities_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "runs_started_idx" ON "ingestion_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "incident_status_idx" ON "service_incidents" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "source_external_unique" ON "source_items" USING btree ("source_id","external_id");--> statement-breakpoint
CREATE INDEX "source_items_story_idx" ON "source_items" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "stories_published_idx" ON "stories" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "stories_category_idx" ON "stories" USING btree ("category");--> statement-breakpoint
CREATE INDEX "stories_rank_idx" ON "stories" USING btree ("rank");--> statement-breakpoint
CREATE INDEX "vulnerability_identifier_idx" ON "vulnerabilities" USING btree ("identifier");