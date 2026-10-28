# Optional deployment and operation

Nothing in this repository automatically publishes a website. Deployment remains the owner's decision.

## Free-first setup

1. Create a Supabase Free project, or use an existing PostgreSQL instance. Copy its **session pooler PostgreSQL connection string** into `DATABASE_URL` on the Node host and in GitHub Actions secrets. Serverless hosts may require a pooler; transaction pooling is supported because prepared statements are disabled. Use TLS per the provider's connection instructions. Never put this value in `NEXT_PUBLIC_*`.
2. Install locked dependencies with `npm ci`, apply `npm run db:migrate`, and run `npm run build`.
3. Run the Node server with `npm start`. For hosted networking, adapt the start command's loopback hostname and port to your host (for example `next start --hostname 0.0.0.0 --port $PORT`). Free hosting eligibility and commercial-use rules vary; verify them before choosing a plan. A self-hosted Node process is also supported.
4. Push this **new repository** to an owner-controlled GitHub repository, only when authorized. Add `DATABASE_URL` as an Actions secret. `SOURCE_GITHUB_TOKEN` is optional; Actions' built-in token is the fallback. No repository remote or push has been performed by this build.
5. Enable the `Collect technology intelligence` workflow. It runs at minute 23 every two hours. Individual source intervals range from two to twelve hours. Schedules can be delayed and may be disabled by GitHub after prolonged repository inactivity.
6. Run the workflow manually once. Check `/sources` for each source's successful collection time, failures and stale state. Check Actions run results. Optional feeds are controlled by `EXTRA_RSS_SOURCES` and `AWS_STATUS_FEED` repository variables.

## Optional HTTP trigger

Standalone Actions execution is preferred: it avoids free hosting request-duration limits. To use `POST /api/ingest`, configure `INGEST_SECRET` with at least 32 random characters and send it as a Bearer token from a trusted scheduler. Requests without a valid token are rejected. A database lock prevents concurrent workers, and source polling windows prevent excessive provider requests. The handler does not accept arbitrary URLs or source configuration from visitors. Never put the secret in a query string. The route's 300-second duration setting is a request to the host, not a guarantee that a free plan allows it.

## Free-tier budgeting

Default schedule: at most 12 starts/day, approximately 360 starts/month. GitHub-hosted Linux execution minutes depend on actual runtime and repository eligibility. A five-minute run would consume roughly 1,800 minutes/month; monitor usage and reduce cadence if needed. Public repositories may receive different allowances. No unlimited-free claim is made.

Supabase Free has database/storage/egress and inactivity constraints that can change. Review the current [Supabase pricing](https://supabase.com/pricing) and [GitHub Actions billing](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions). Keep indexes and retention bounded, monitor `pg_database_size`, and archive old incident/advisory records before approaching capacity. Avoid storing full article payloads or images.

Backoff doubles failed-source polling intervals up to eight times normal. Successful sources continue. HTTP 403 is recorded without bypass. HTTP 429 honors short Retry-After waits; long cooldowns are persisted in `next_allowed_at` and honored even by forced retries rather than tying up the worker. Ingestion logs retain 30 days; news retains 90. Failed-source visibility is in `/sources`; all-source failure gives the CLI a nonzero exit. Partial failures remain recorded and visible but do not suppress successful ingestion.

## Security and ownership

- Use separate database roles for migrations and runtime in production. The local development password is not suitable for deployment.
- RLS is enabled on tables without public policies. Do not distribute a Supabase service-role key or PostgreSQL password to clients.
- Production UI accepts only HTTP(S) source links, renders text without source HTML, and restricts query size/page size.
- Optional LLM endpoints are operator configuration. Treat source material as untrusted; AI text is not confirmation.
- Review source terms before enabling additional RSS descriptions or optional services. No paywall, authentication or anti-bot bypass exists.
- Do not expose `.local`, `.env.local`, database backups, npm caches or browser artifacts in deployments.

## Operations

Verify `/api/health` returns 200, `/sources` shows expected syncs, and recent `ingestion_runs` contain successes. Check failure logs before retrying a source. Do not use `--force` in the regular schedule. Back up PostgreSQL according to the chosen provider's available tools. Apply migrations before new code that depends on them. Roll back code only when schema compatibility is established.
