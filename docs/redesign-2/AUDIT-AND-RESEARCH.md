# The Signal 2.0 — audit and research

26 October 2026. Local redesign only. Repository: `the-signal/`; the parent application is unrelated. Existing files are untracked, so `artifacts/redesign-2/source-before.tgz` preserves the inspected baseline before implementation.

## Audit

Next.js App Router, React, TypeScript, Tailwind import with hand-authored global CSS, Drizzle/PostgreSQL. `app/page.tsx` composes eight editorial areas; `[section]` dispatches real topic, search, status, watchlist and settings routes. News is server rendered. Client islands manage browser-local bookmarks, watchlists, sharing, theme and navigation. Preserve storage keys and database.

Database audit: 245 news records, 30 with source excerpts; 2,321 advisory records; 165 incident records. No licensed full article body, author or rights field. AI summaries are optional, explicitly unverified, and must never qualify as full articles. Hacker News timestamps describe submissions, not necessarily original publication. Source names may identify a collector rather than the original publisher. The visual asset manifest is empty; all current images are original SVG conceptual illustrations. Do not add unlicensed photography.

Baseline captures show oversized lead (up to 78px), 32px rail headlines, 11–12px metadata and the same globe for French DNS and UK planning stories. Source pages show giant headlines/art despite absent body content, then visible ingestion scores. Current typography is Newsreader/Plex. Existing skip link, keyboard menu, bookmark state, native form filters, reduced motion and visible focus are useful foundations. No client animation dependency is needed. Baseline captured at 1440 and 390px; no full-article baseline exists.

## Research translated into decisions

- [Nielsen Norman Group, visual design principles](https://media.nngroup.com/media/articles/attachments/Principles_Visual_Design-A4.pdf): use relative scale and grouping to direct attention. Apply three story scales; one dominant lead, two quiet supporting stories, subordinate briefs. Article ranking goes into native disclosure. The visual-hierarchy/progressive-disclosure article fetches timed out; search extracts were available, and the principles PDF was accessed directly.
- [Baymard, line-length readability](https://baymard.com/research-articles/line-length-readability): its 50–75-character guidance comes from commerce research, not a universal news law. Start near 65ch, then inspect real text and resizing.
- [Butterick, body text](https://practicaltypography.com/body-text.html): choose font, size, spacing and measure together. Use Source Serif 4 at 19–20px with 1.65 line height for reading, Source Sans 3 for utilities, and retain Newsreader solely as the recognizable masthead. Serif is an editorial choice, not a claim of universally superior accessibility.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): test contrast, reflow, keyboard focus, text spacing and resizing, including both themes. Native disclosures avoid a custom keyboard widget. Aim for 44px utility targets. Automated checks are not a certification.
- [FT Visual Vocabulary](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md): choose graphics from the relationship to explain. No chart without numeric evidence. No map of alleged government procedure without verified reporting.
- [Datawrapper on color vision](https://www.datawrapper.de/blog/colorblindness-part1): labels and shapes carry meaning as well as color; diagram alternatives explain relationships in text.
- [Reuters Institute, Digital News Report 2025](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/dnr-executive-summary): fragmented consumption and weak engagement support an experiment with a bounded briefing and clearer source identity. This is a design inference, not evidence that this redesign reduces news avoidance.

## Editorial references

[Picnic Post](https://picnicpost.com/) and [Funday Press](https://thefundaypress.com/) communicate a clear finite issue and playful paper identity. They are physical-paper subscription pages, not directly comparable news homepages. Borrow restraint and warmth, not sales sections. [Mic](https://www.mic.com/) pairs descriptive headlines with decks and differentiates feature selections from latest items. [The Pudding](https://pudding.cool/) gives stories topic-specific visual identities and clear archives. These pages were accessed; browser visual captures are recorded separately if successful. [NYT](https://www.nytimes.com/) was inaccessible to the research tool; do not claim a current visual audit of it.

## Plan

1. Shared Source font pair, semantic light/dark tokens, readable metadata and resilient sizing.
2. Lead → Daily Brief → Go Deeper. Real specialist topics and personalization remain directly reachable.
3. Compact source previews; explicit vetted content registry and full-reading renderer; advisory/incident data preserved. No invented articles to demonstrate the layout.
4. Story-specific original SVGs for DNS and planning, only conceptual where source verification is unavailable; no universal globe fallback.
5. Persistent reading size, accessible navigation/disclosures, save/share feedback.
6. Build/type/lint/tests, real browser at 360/390/768/1024/1440/1920, enlargement/text spacing, dark mode, keyboard and feature regressions; screenshots and measured local performance.

The French and UK original reporting URLs were inaccessible to the research tool. Their exact existing headlines and links remain; neither is rewritten or expanded. DNS concepts can be grounded in [RFC 1034](https://www.rfc-editor.org/info/rfc1034/). The illustration must not assert that blocking occurred. Planning art must remain an explicitly conceptual paperwork/server metaphor.

## Visual reference inspection

Browser captures confirmed Picnic Post's centered issue image and short promise, Funday's emphatic masthead and tangible paper object, and Mic's strong split between feature imagery and the latest list. These are editorial observations, not evidence that their conversion layouts fit The Signal. The Pudding's text/index loaded but its imagery was still placeholders at capture, so imagery was not evaluated from that screenshot. NYT produced a blank screenshot; its visual behavior remains unverified. Reference captures are stored in `artifacts/redesign-2/`.

## Implementation decisions after visual inspection

The original DNS lead is retained by an explicit edition choice in `data/edition.json`, rather than by the old rule that promoted stories because an illustration was available. If that story leaves the current queried collection, ordinary editorial query order takes over. The Daily Brief samples existing topic categories before filling remaining slots; topic collections reserve two real source links apiece. This is a presentation selection, not a rewrite of ranking or source facts. No source-only page gets a decorative hero. Domain names identify the original destination without inventing publisher display names. Collection labels preserve Hacker News and other discovery sources separately.
