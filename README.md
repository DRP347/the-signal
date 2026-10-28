# The Signal

An independent technology intelligence product built with Next.js App Router, TypeScript, Tailwind, Lucide, Drizzle and PostgreSQL. No paid API or AI service is required. This is a **separate Git repository**; the parent EarPods application is not part of it.

## Run locally

Node.js 22 or later is required. Install dependencies with `npm ci`.

```sh
cp .env.example .env.local
npm run db:local
```

Keep the database terminal open. The development-only PostgreSQL instance binds to loopback on port 54329, persists in `.local/postgres`, and uses credentials explicitly marked for local use. Do not use these credentials for hosting. macOS may require permission for PostgreSQL shared memory. You can instead use your own PostgreSQL or a free Supabase database by setting `DATABASE_URL`.

In a second terminal:

```sh
npm run db:migrate
npm run ingest -- --force
npm run build
npm start
```

Open [http://127.0.0.1:3100](http://127.0.0.1:3100). For editing, use `npm run dev`. If macOS file watchers hit `EMFILE`, use the production build/start commands above. Never run dev and build against the same `.next` folder simultaneously.

## What works

- All requested routes: overview, briefing, latest, security, outages, developers, AI, community, vulnerabilities, watchlist, search, story details, sources and settings.
- PostgreSQL migrations, relational provenance, incremental collection, idempotent upserts, advisory alias consolidation, conservative news clustering, source-specific error isolation and health records.
- Real APIs and RSS feeds, local watchlists/bookmarks, server-rendered search and database pagination, light/dark themes, semantic keyboard-accessible controls.
- Scheduled GitHub Actions worker and optional authenticated POST endpoint. Worker execution does not depend on the website being awake.
- Default deterministic source previews. Optional LLM-generated text is separate, labeled, cited, and never verification evidence.

No source data is seeded into production. Unit-test fixtures remain in `tests/` and never enter the runtime database.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run db:local` | Persistent local PostgreSQL process |
| `npm run db:migrate` | Apply versioned SQL migrations |
| `npm run ingest` | Collect sources whose polling windows are due |
| `npm run ingest -- --force --only=hn,osv` | Explicit bounded source refresh |
| `npm test` | Offline processing and adapter tests |
| `npm run verify:live` | Verify live persisted records and idempotent reprocessing |
| `npm run test:integration` | Destructive tests ONLY in isolated `TEST_DATABASE_URL` ending in `_test` |
| `npm run typecheck` | TypeScript checks |
| `npm run lint` | Code checks |
| `npm run build` | Production build |
| `node scripts/browser-check.mjs` | Local browser/interaction checks; set CHROME_PATH for another Chromium binary |

## Project map

```text
app/                     Server-rendered pages and API routes
  [section]/page.tsx     Secondary route dispatch
  story/[slug]/          Source-linked story, advisory and incident details
  api/ingest/            Authenticated ingestion endpoint
  api/stories/           Bounded watchlist/bookmark queries
  api/health/            Database availability, no sensitive connection details
components/              Editorial shell and isolated client preferences
lib/db/                  Drizzle schema and PostgreSQL connection
lib/ingestion/           Source registry, adapters, HTTP policy, worker, optional AI
lib/processing.ts        URL normalization, clustering, previews, ranking
lib/queries.ts           Pagination, filters, cached overview and source health
migrations/              Versioned PostgreSQL DDL
scripts/                 Local database, migrations, worker, verification
 tests/                  Offline fixtures and critical-processing tests
.github/workflows/       Scheduled ingestion and CI
```

## Automation and deployment

Nothing has been published or deployed. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for an optional Supabase + Node hosting setup, workflow secrets, realistic free-tier limits, and maintenance. GitHub Actions cannot run until this repository is pushed to a repository you control and its secrets are configured.

Read [docs/SOURCES.md](docs/SOURCES.md) for official endpoint references, activation rules and access limitations. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for data semantics and tradeoffs. [docs/VERIFICATION.md](docs/VERIFICATION.md) records actual local results and remaining gaps.

## Deliberate boundaries

This is scheduled intelligence, not an uptime monitor. An unavailable source is not a confirmed outage. CISA catalog inclusion dates are not vulnerability publication dates. Unknown severity remains unknown. OSV collection covers the configured packages, not every ecosystem. Community links are not independently verified journalism. A published RSS feed does not convey unrestricted article reuse; headlines and source links are the default.

No account is required. Browser preferences are local; the reserved preferences/bookmarks database tables have no unauthenticated write API. No telemetry, ads, trackers or analytics are included.

## Editorial redesign

The newspaper design uses self-hosted Newsreader and IBM Plex, varied story-led layouts, light/dark themes and responsive reading pages. See [editorial architecture](docs/EDITORIAL-DESIGN.md), [visual rights policy](docs/VISUALS.md) and [redesign verification](docs/REDESIGN-REPORT.md). No external photos are licensed in the initial manifest; clearly labeled original vector illustrations provide relevant visuals without implying photographic evidence.

Set `SITE_URL` to the canonical origin when deploying. Local preview remains at http://127.0.0.1:3100. Run `node scripts/editorial-check.mjs` for the additional keyboard, share and accessibility checks.
