# Gates: Editorial redesign
OWNS: app/**, components/**, lib/**, public/**, docs/**, tests/**, scripts/**, migrations/**
Scope: Story-led editorial redesign preserving real-data behavior and local-only delivery.

- [x] R1: Processing and editorial selection tests pass
  CHECK: npm test
  EXPECT: fail 0
  EVIDENCE: automatic-evidence=v1; definition-sha256=29459e73eeecdf01d1217661a57d6bf4eca08c68489167b4db5a5ce0576dd123; exit=0; EXPECT=matched; output-sha256=71d290e37884bc79e9fec5741cb9db80704ea1767ea275e8b9f38a507d3939fa; output-bytes=1704; shell=/bin/sh; cwd=/Users/gandu/Documents/content/the-signal; path=786943a8e83f/19 entries
- [x] R2: TypeScript and lint pass
  CHECK: npm run typecheck && npm run lint
  EXPECT: eslint .
  EVIDENCE: automatic-evidence=v1; definition-sha256=5d60e6c79d1406bd01dcb7a0d600390d7aedf2178e8d71391da6e94ab4eea638; exit=0; EXPECT=matched; output-sha256=05b7b968ce4470985aeb4451fdb68f421aa49668756c41ebc7feac0febf5218d; output-bytes=83; shell=/bin/sh; cwd=/Users/gandu/Documents/content/the-signal; path=786943a8e83f/19 entries
- [x] R3: Production build succeeds
  CHECK: npm run build
  EXPECT: Route (app)
  EVIDENCE: automatic-evidence=v1; definition-sha256=dba363b0190c1128fb6e2343de716e88786b78793d651a903d34852ce0df0550; exit=0; EXPECT=matched; output-sha256=57c93f55198fb15d96eca30680294ea0c901fd5c891d9108e286ae6fb7e0ebbc; output-bytes=882; shell=/bin/sh; cwd=/Users/gandu/Documents/content/the-signal; path=786943a8e83f/19 entries
- [ ] R4: Six-width screenshot review confirms editorial composition and no page overflow
  EVIDENCE: pending browser review
- [ ] R5: Search, bookmarks, watchlist, theme, sharing, navigation and article attribution work
  EVIDENCE: pending interaction checks
- [ ] R6: Photos are approval-gated; original illustrations and charts are labeled and source-linked
  EVIDENCE: pending visual provenance review
- [ ] R7: Automated WCAG checks and manual keyboard review pass
  EVIDENCE: pending accessibility review
