# Gates: The Signal editorial redesign 2

OWNS: app/**, components/**, lib/editorial.ts, lib/article-content.ts, lib/visuals.ts, data/articles.json, public/fonts/**, scripts/*2*, tests/editorial.test.ts, tests/article-content.test.ts, docs/redesign-2/**, artifacts/redesign-2/**

Scope: A local, source-honest editorial redesign with preserved ingestion, attribution, topic routes and browser preferences.

- [ ] G1: Research and current-site audit inform a three-layer editorial hierarchy.
  EVIDENCE: pending
- [ ] G2: Type checking, lint, processing and content integrity tests pass.
  CHECK: node scripts/verify-engineering-2.mjs
  EXPECT: ENGINEERING VERIFIED
  EVIDENCE: pending
- [ ] G3: Production build succeeds with the existing stack.
  CHECK: SIGNAL_BUILD_DIR=.next-review npm run build
  EXPECT: Finalizing page optimization
  EVIDENCE: pending
- [ ] G4: Responsive, keyboard, accessibility and preserved-feature browser checks pass.
  CHECK: node scripts/redesign-2-check.mjs
  EXPECT: BROWSER VERIFIED
  EVIDENCE: pending
- [ ] G5: Before and after screenshots have been inspected and visual defects corrected; content and art remain honest.
  EVIDENCE: pending
- [ ] G6: Final report accounts for implementation, actual measurements, limitations and local review URL; no deployment operations.
  EVIDENCE: pending
