# Architecture and data semantics

## Request path

Next.js server components read PostgreSQL. Overview data is cached for 120 seconds, source health for 60 seconds. Category/search/detail requests use bounded database queries. Page requests never trigger ingestion. Database failures show unavailable/error states. No JSON snapshot or demo dataset substitutes for PostgreSQL.

## Worker path

1. Take a PostgreSQL advisory lock on a reserved connection; concurrent workers exit without overlapping writes.
2. Register configured sources and taxonomies.
3. Check each source's polling window and failure backoff.
4. Fetch from documented public API/feed endpoints with a 15-second request timeout, bounded concurrency, up to three attempts, exponential jitter, and Retry-After handling. Access denials are not retried. Long provider cooldowns defer to a future schedule.
5. Normalize safe HTTP(S) links and metadata, sanitize markup, and retain short previews only.
6. Match source/external IDs, canonical URLs, advisory aliases, then conservative headline similarity for news within 48 hours. Different CVE/version tokens prevent fuzzy merges. Status incidents never undergo headline grouping.
7. Store stories, source records, story-source joins, technology joins and advisory/incident details in a transaction per source. A failed transaction rolls back that source's records.
8. Record last success/failure and run results independently. Optional AI is bounded to three eligible entries per source/run and cannot roll back source ingestion.
9. Retain news for 90 days, logs for 30 days. Advisory and incident histories are retained; monitor storage and set a suitable archival policy before larger deployments.

## Tables

- `sources`: endpoint, documentation, source type/weight, polling interval, last attempt/success, errors, HTTP validators and incremental cursor.
- `source_items`: unique source + external ID, original headline/URL, timestamps, discussion metadata, processing status, story association.
- `stories`: unique canonical URL/slug, concise preview, optional separately stored AI output, category, verification label, known publication/event times, collection/verification times, ranking rationale.
- `story_sources`, `story_technologies`: foreign-keyed associations.
- `categories`, `technologies`: controlled taxonomy.
- `vulnerabilities`: advisory identifiers and cited structured metadata, versions, fixed versions, official severity, known exploitation and actions.
- `service_incidents`: official provider state and incident timestamps.
- `ingestion_runs`: bounded operational log.
- `user_preferences`, `bookmarks`: reserved for a future authenticated server-backed implementation. The current application uses browser-local storage and exposes no unauthenticated write endpoints for these tables.

Foreign keys, uniqueness, and category/date/rank/identifier/status indexes enforce integrity. RLS denies anonymous Supabase Data API access; the server uses a private PostgreSQL connection. Production should use a least-privileged application role, with a separate migration owner.

## Preview and optional AI modes

The default preview is sanitized, capped source metadata. RSS descriptions are disabled unless `RSS_EXCERPTS=true` after permission review. Headlines and attribution remain visible. No full article body is fetched.

The optional provider uses an OpenAI-compatible chat-completions endpoint. Set `ENABLE_AI=true`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`. A local compatible model server is possible; paid APIs are not needed. Text is untrusted input, output is bounded and always labeled. Model prompting reduces but cannot eliminate hallucinations; output never changes verification, severity, exploitation or incident state. Sources remain the authority.

## Coverage and limits

HN collects a bounded union of top/new/best lists. DEV requests public metadata. GitHub uses a 14-day first-run window and up to three 100-item pages in ascending updated order; subsequent runs use the cursor with a small overlap. OSV queries next, react, django and laravel/framework, with up to four pages per package. This is useful scoped coverage, not a global exhaustiveness claim.

Ranking is editorial: source weight, recency, documented impact and bounded community interest. Listing priority decays with age. Watchlists match controlled technology keywords and filter the relevant stream. Exact story URLs and official advisory aliases are reliable consolidation keys; fuzzy grouping intentionally favors false negatives over merging unrelated incidents.

Feed freshness does not establish universal service health. The UI always distinguishes source fetch state from the provider's last reported incident state. Dates absent from source payloads stay null. Test fixtures never enter production ingestion.
