# Source registry and permissions

Endpoints are configured only in `lib/ingestion/sources.ts`. Adapters do not scrape article pages, execute site scripts, follow paywalls, or rotate user agents to bypass restrictions. HTTP requests use an identifiable configurable User-Agent. Reading source HTML during development was only to verify advertised RSS links, not a production scraping pipeline.

| Source | Official documentation / discovery | Endpoint / scope |
| --- | --- | --- |
| Hacker News | https://github.com/HackerNews/API | `https://hacker-news.firebaseio.com/v0`, top/new/best and item metadata |
| DEV | https://developers.forem.com/api | `https://dev.to/api/articles`, public metadata |
| CISA KEV | https://www.cisa.gov/known-exploited-vulnerabilities-catalog | Official `sites/default/files/feeds/known_exploited_vulnerabilities.json` catalog |
| OSV | https://google.github.io/osv.dev/post-v1-query/ | `https://api.osv.dev/v1/query`, explicit package scope and pagination |
| GitHub Advisories | https://docs.github.com/en/rest/security-advisories/global-advisories | `https://api.github.com/advisories`, reviewed advisories, incremental updated cursor |
| Ars Technica | https://arstechnica.com/rss-feeds/ | `https://feeds.arstechnica.com/arstechnica/index`, publisher-listed feed |
| The Register | https://www.theregister.com/Design/page/feeds | `https://www.theregister.com/headlines.atom`, official feed directory |
| Krebs | https://krebsonsecurity.com/ | `https://krebsonsecurity.com/feed/`, verified HTML `rel=alternate` |
| Cloudflare Blog | https://blog.cloudflare.com/ | `/rss/`, verified HTML `rel=alternate` |
| BleepingComputer | https://www.bleepingcomputer.com/rss-feeds/ | `/feed/`, verified publisher HTML; optional until intended reuse reviewed |
| InfoQ | https://www.infoq.com/ | `https://feed.infoq.com/`; disabled pending publisher terms/access review |
| GitHub Status | https://www.githubstatus.com/api | `/api/v2/incidents.json` |
| Cloudflare Status | https://www.cloudflarestatus.com/api | `/api/v2/incidents.json` |
| Vercel Status | https://www.vercel-status.com/api | `/api/v2/incidents.json` |
| Google Cloud | https://status.cloud.google.com/ | `/incidents.json`, official JSON History link |
| AWS | https://docs.aws.amazon.com/health/latest/ug/aws-health-dashboard-status.html | Optional service-specific official RSS URL supplied by owner; no guessed aggregate endpoint |

RSS by default retains headline, original URL, publication date and feed provenance only. `RSS_EXCERPTS=true` permits capped descriptions only after the owner has verified the relevant rights. Public feed availability is not treated as a blanket copyright license. Article authors/publishers retain ownership; original source links are prominent. Engineering blog marketing claims are not treated as independent evidence.

The source credibility weight describes source class for ranking, not a certification of truth. Community sources are identified as community; official advisories are identified by their issuing authority. Status providers confirm only their own reported state. A monitoring/network failure is not an incident.

## Optional integrations

The registry includes disabled entries for daily.dev, Reddit, X/Twitter, Lobsters, Hashnode, Product Hunt, Stack Overflow and Cloudflare Radar. `PermittedOptionalAdapter` and `validateOptionalAdapter` establish the extension interface. They are **not implemented or activated live connectors**. To enable one, document allowed API use, supply credentials securely if required, implement pagination/rate policies, add adapter tests and then set the source enabled. Do not scrape a restricted product as a fallback.

AWS similarly requires a service-specific feed from the official status interface. Its RSS adapter deliberately keeps incident state unknown unless a future structured documented payload supplies it; text matching cannot reliably confirm resolution.

## Verified local collection

See `docs/VERIFICATION.md` for observed run results. Live access can change; source health in the application is the current authority. DEV and GitHub API requests timed out in the initial environment. Both succeeded in the 25 October 2026 refresh. GitHub now uses second-precision date filters and cursor pagination; capped batches retain their continuation for subsequent runs.
