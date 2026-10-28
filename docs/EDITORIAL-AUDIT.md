# Editorial redesign audit — 25 October 2026

## Existing architecture
Next.js 16 App Router, React 19, TypeScript, Tailwind 4 plus global CSS, Lucide, PostgreSQL/Drizzle. Server components deliver stored stories; ingestion and source health run independently. Preferences use isolated client components and localStorage. No font files or image-permission records existed.

Keep: source adapters, attribution, source health, advisory/incident semantics, security metadata, search/filter query paths, pagination, bookmarks/watchlists, theme preference keys, and all routes. No push, remote creation or deployment.

## Observed problems
The marketing intro occupies the first editorial viewport. Headlines are smaller than the promise above them. Most metadata is 8–11px. Repeated rows and repeated stories flatten hierarchy. Monitoring panels dominate the sidebar. The two-column structure causes uneven blank areas. Article pages lead with machine metadata before readable context. No reusable visual provenance or useful visual fallback policy exists.

## Reference interpretation
NYT: differentiated hierarchy and newspaper divisions. The supplied screenshot's unloaded images are not design assets. Picnic Post: invitation and occasional warmth, without its sales funnel. Funday Press: confident typography and restrained graphic color. Mic: asymmetry and section-specific character. Avoid product-purchase heroes, conversion blocks, repetitive cards and copied publisher identity. NYT and The Weekend Times could not be loaded through the reference fetcher; use the supplied references and stated direction without claiming live visual inspection.

## Implementation architecture
- Self-host Newsreader variable roman/italic, IBM Plex Sans, IBM Plex Mono with font licenses.
- Warm paper/ink tokens; forest, marigold, vermilion and lavender have specific roles. Contrast-adjusted text tokens accompany decorative palette values.
- A 12/8/4-column grid and typographic scale, without fixed headline heights or truncation.
- Shared Lead, Secondary, Compact, Briefing, Deep Read, Culture, Visual Explainer, Security and Personal modules.
- Deterministic selection reserves each story once per homepage. Sparse feeds reduce modules rather than repeat headlines or invent content.
- Photography requires an approved metadata record and reviewed crop. Default visuals are original topical SVG illustrations, explicitly labeled as illustration, or source-derived charts. No Open Graph scraping.
- Article pages retain all data but foreground the headline, deck and sources; source-supported context, related records and native share/copy controls follow.
- Six responsive widths, interaction regression checks, automated accessibility, and visual screenshot review before completion.
