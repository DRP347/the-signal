# Visual provenance and publishing policy

No external photographs are currently approved. The empty `data/visuals.json` is intentional. Feed and Open Graph image URLs are never promoted into reusable assets automatically.

The five vector illustrations in `components/illustration.tsx` were created for this project in code. Their subjects are device access, AI input/model/output, software security, code dependencies and network connections. They are conceptual artwork, never reconstructions, product screenshots or live measurements. Every rendering includes an Illustration credit; story pages include the fuller explanatory caption. Topic matching lives in `lib/visuals.ts`; unmatched stories remain text led. Original vector artwork needs no third-party photo license.

To approve a future image, place the optimized file under `public/media/` and add an EditorialVisual entry to the manifest. Supply the actual story URL/id, subject, visual kind, original image source URL, creator, rights holder, caption, credit, license, permission record, accurate alt text, verification date, intrinsic dimensions, reviewed crop and focal point. A human must validate the permission record and crop in context. Do not mark an image verified merely because an API returns it. Keep restricted permission documents private and reference their record identifier.

Only verified records with all required metadata are rendered. Local image URLs use Next Image responsive optimization, intrinsic dimensions, lazy loading below the lead and explicit loading-error fallback. The original source, credit and license appear in the caption. Pending/rejected assets do not render.

Self-hosted Newsreader, IBM Plex Sans and IBM Plex Mono files, original download URLs and OFL license notices are in `public/fonts/`. Newsreader includes real variable roman and italic faces. Font downloads are not required at application build or request time.
