/* eslint-disable @next/next/no-html-link-for-pages -- Standalone fixture has no Next router. */
/* Browser-only QA fixture. Never imported by a production route or ingestion. */
import { createRoot } from "react-dom/client";
import { ArticleBody } from "../../components/article-body";
import { ReadingTools } from "../../components/reading-tools";
import { VerifiedImage } from "../../components/visual-media";
import type { FullArticle } from "../../lib/article-content";
const article: FullArticle = {
  storyId: "local-layout-fixture",
  kind: "original-article",
  author: "Local layout fixture",
  deck: "A test of reading measure, paragraph rhythm and controls. This is not a news article.",
  publishedAt: "2026-10-26",
  reviewedAt: "2026-10-26",
  rights: {
    basis: "original",
    record:
      "Original interface-test copy. Not ingested or published as reporting.",
  },
  sources: [
    {
      title: "WCAG 2.2 text spacing",
      url: "https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html",
    },
  ],
  blocks: [
    {
      type: "paragraph",
      text: "This page tests the full reading layout with clearly identified sample text. It is kept outside the news database and is not offered as reporting. The production template uses this same body component only when an article includes an author, a review date, sources and a recorded basis for using its text.",
    },
    { type: "heading", text: "A comfortable place to read" },
    {
      type: "paragraph",
      text: "A paragraph needs enough room for a complete thought. This sample allows the browser check to inspect line length, line spacing and the space between paragraphs. The larger-text setting should make the words easier to see while keeping the page within the viewport. A long line should wrap without hiding the end of a sentence.",
    },
    {
      type: "paragraph",
      text: "Use the reading controls to enlarge this text or enter focus mode. The same controls must remain reachable from the keyboard, and a reader must be able to leave focus mode without reloading. The layout should also adapt when a reader applies their own letter spacing, word spacing and paragraph spacing.",
    },
    { type: "heading", text: "Keep the source in view" },
    {
      type: "paragraph",
      text: "Source notes belong after the main text. This last paragraph gives the page a natural ending before those notes appear. Nothing in this sample changes the underlying story records, replaces the publisher’s words or supplies missing facts for a headline-only item.",
    },
  ],
};
function Fixture() {
  return (
    <>
      <header className="masthead">
        <div className="masthead-main">
          <a className="wordmark" href="/">
            the signal.
          </a>
          <span>Local QA fixture</span>
        </div>
      </header>
      <main id="main">
        <article className="story-detail full-reading">
          <div className="article-reading">
            <a className="back-link" href="/">
              ← Front page
            </a>
            <div className="eyebrow">
              Layout fixture · not published reporting
            </div>
            <h1>A quieter page for a longer read</h1>
            <p className="article-byline">Local layout fixture</p>
            <p className="article-deck">{article.deck}</p>
            <ReadingTools />
            <ArticleBody article={article} />
            <details className="source-disclosure">
              <summary>Missing-image test</summary>
              <VerifiedImage
                visual={{
                  id: "missing-fixture",
                  relatedStory: article.storyId,
                  subject: "Test",
                  kind: "photograph",
                  src: "/media/intentionally-missing-fixture.webp",
                  sourceUrl: "https://example.org",
                  creator: "Test",
                  rightsHolder: "Test",
                  caption:
                    "This intentionally missing image tests the readable fallback.",
                  credit: "Test",
                  license: "Test",
                  permissionRecord: "Test",
                  alt: "An intentionally unavailable test image",
                  verification: "verified",
                  verifiedAt: "2026-10-26",
                  width: 800,
                  height: 500,
                  focalPoint: { x: 0.5, y: 0.5 },
                  cropReviewed: true,
                }}
              />
            </details>
          </div>
        </article>
      </main>
      <footer>Local layout fixture — never published as reporting.</footer>
    </>
  );
}
createRoot(document.getElementById("fixture")!).render(<Fixture />);
