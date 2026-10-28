# Validation and production handoff — 28 October 2026

The user authorized GitHub publishing, Vercel production deployment, and a free hosted PostgreSQL database on 28 October, superseding the earlier local-only scope.

## Production

- Website: https://the-signal-eight-lake.vercel.app
- Repository: https://github.com/DRP347/the-signal
- Vercel project: `the-signal` in `deepaks-projects-c818d101`.
- Database: Neon `the-signal-db`, confirmed `free_v3` (Free) plan.
- Vercel serves requests through the pooled database URL. GitHub Actions uses the direct URL because ingestion holds a session advisory lock.
- Scheduled ingestion: every two hours at minute 23. Credentials are stored as platform secrets, not committed.
- Publishing currently uses the Vercel CLI. The Vercel GitHub integration did not have repository access; automatic deployments are not enabled.

## Confirmed checks

- TypeScript, ESLint, 24 unit tests, PostgreSQL integration tests in GitHub CI, and production builds passed.
- Local browser regression: 52 reflow checks, 41 axe scans, 13 functional groups passed. Includes keyboard navigation, saved items, search, theme, reading preferences, full-body QA fixture, and text-spacing checks.
- Public unauthenticated browser checks passed at 390px and 1440px for the homepage, story detail, search, sources, and security routes. No JavaScript page errors were observed; checked index routes had no horizontal overflow.
- Public `/api/health` returned HTTP 200 with `database: available`.
- Local evidence: `artifacts/redesign-2/validation.json`, `live-deployment.json`, and `live-390.png` / `live-1440.png`.

## Limits

Desktop Chromium emulation does not establish physical iOS/Android or screen-reader behavior. The 200% check covers equivalent narrow reflow and enlarged root text, not native browser zoom. Full-article interactions use a clearly labeled local QA fixture: no licensed full articles were invented or promoted from previews. External source failures remain visible on Sources. Free database and hosting quotas still apply.

## Initial hosted collection

The [hosted workflow](https://github.com/DRP347/the-signal/actions/runs/40670404166) completed successfully. At verification, the production database contained 140 news records, 2,325 vulnerability records, and 158 incident records, with 12 sources having successful collections. Counts will change as scheduled collection runs. Interrupted local setup runs were explicitly marked failed instead of being left indefinitely running.

## Performance evidence

The redesigned local production build measured median LCP 880 ms and CLS 0.00044 across three cold-browser samples at 390×844, 4× CPU slowdown, 150 ms latency, and 1.6 Mbps download. This is a local laboratory measurement, not live field Core Web Vitals. Scripted theme-event durations were 72–96 ms, not field INP. No performance improvement claim is made because the old build's identity was not independently re-established after the session restart. Raw measurements are in `artifacts/redesign-2/performance.json`.
