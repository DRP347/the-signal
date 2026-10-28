import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { storyDetail, storyList, stamp } from "@/lib/queries";
import { BookmarkButton } from "@/components/preferences";
import { safeUrl } from "@/lib/processing";
import { StoryVisual, CompactNews } from "@/components/newspaper";
import { ArticleBody } from "@/components/article-body";
import { articleFor, contentLabel } from "@/lib/article-content";
import { calendarDate, publisherLabel } from "@/lib/editorial";
import { ReadingTools } from "@/components/reading-tools";
import { ShareButton } from "@/components/share-button";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await storyDetail(slug);
  return {
    title: result?.story.title ?? "Story unavailable",
    description: result?.story.preview || undefined,
    alternates: { canonical: `/story/${slug}` },
    openGraph: {
      title: result?.story.title ?? "Story unavailable",
      type: "article",
    },
  };
}
export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await storyDetail(slug);
  if (!data) notFound();
  const { story, sources, vulnerability, incident } = data;
  const article = articleFor(story);
  const sourceOnly = !article && !vulnerability && !incident;
  const community = sources.some(({ source }) => source.id === "hn");
  const original = safeUrl(story.canonicalUrl);
  const v = vulnerability?.details;
  const i = incident?.details;
  const related = (
    await storyList({ category: story.category, kind: story.kind })
  ).rows
    .filter(
      (s) =>
        s.id !== story.id &&
        (s.technologyTags.some((tag) => story.technologyTags.includes(tag)) ||
          s.title
            .toLowerCase()
            .split(/\W+/)
            .some(
              (word) =>
                word.length > 5 && story.title.toLowerCase().includes(word),
            )),
    )
    .slice(0, 3);
  const attributed = {
    ...story,
    attribution: sources.map(({ source, item }) => ({
      name: source.name,
      url: item.originalUrl,
    })),
  };
  const structured = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: story.title,
    description: story.preview || undefined,
    isBasedOn: sources.map(({ item }) => item.originalUrl),
  };
  return (
    <article
      className={`story-detail ${sourceOnly ? "source-preview" : "full-reading"}`}
    >
      <div className="article-reading">
        <Link href="/" className="back-link">
          <ArrowLeft size={14} /> Back to the front page
        </Link>
        <div className="eyebrow">
          {contentLabel(story)}{" "}
          <span className="muted">/ {story.category}</span>
        </div>
        <h1>{story.title}</h1>
        <p className="article-byline">
          {article ? (
            `By ${article.author}`
          ) : (
            <>
              Original source · <strong>{publisherLabel(story)}</strong>
            </>
          )}
        </p>
        <p className="article-date">
          {article
            ? `Published ${calendarDate(article.publishedAt)}`
            : community
              ? `Shared on Hacker News ${calendarDate(story.publishedAt)} · Original publication date not supplied`
              : story.publishedAt
                ? `Published ${calendarDate(story.publishedAt)}`
                : "Publication date not supplied"}
        </p>
        {article ? (
          <>
            <p className="article-deck">{article.deck}</p>
            <ReadingTools />
            <StoryVisual story={attributed} priority />
            <ArticleBody article={article} />
          </>
        ) : (
          <>
            {story.preview ? (
              <div className="source-excerpt">
                <span className="kicker">Source-provided excerpt</span>
                <p>{story.preview}</p>
              </div>
            ) : sourceOnly ? (
              <p className="source-explanation">
                {community
                  ? "This headline was shared on Hacker News. Follow the link for the original publisher’s reporting."
                  : "This is a curated link. The full reporting is available from the original publisher."}
              </p>
            ) : null}
            {original && (
              <a
                className="dark-button original-reporting"
                href={original}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the original reporting <ArrowUpRight size={17} />
              </a>
            )}
          </>
        )}
        <div className="article-actions">
          <BookmarkButton id={story.id} showLabel />
          <ShareButton title={story.title} />
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
          }}
        />
        {story.aiSummary && (
          <details className="source-disclosure">
            <summary>Optional AI summary · unverified</summary>
            <p className="notice">
              AI-generated from the attributed metadata. Not independently
              verified; confirm all details in the original.
            </p>
            <p>{story.aiSummary}</p>
            {story.aiSources
              ?.filter((s) => safeUrl(s))
              .map((s) => (
                <p key={s}>
                  <a href={s} target="_blank" rel="noopener noreferrer">
                    Summary source ↗
                  </a>
                </p>
              ))}
          </details>
        )}
        {v && (
          <>
            <section className="detail-section" style={{ marginTop: 25 }}>
              <h2>Official advisory details</h2>
              {v.withdrawn && (
                <p className="notice">
                  This advisory has been withdrawn by a source. Review the
                  official record before acting.
                </p>
              )}
              <dl className="detail-facts">
                <div>
                  <dt>Identifiers</dt>
                  <dd>{v.identifiers.join(" · ")}</dd>
                </div>
                <div>
                  <dt>Official severity</dt>
                  <dd>
                    {v.severity ?? "Unknown"}
                    {v.cvss !== null ? ` · CVSS ${v.cvss}` : ""}
                  </dd>
                </div>
                <div>
                  <dt>Exploitation status</dt>
                  <dd>
                    {v.exploitation === "known exploited"
                      ? "Known exploited — CISA catalog"
                      : "Unknown; not established by these records"}
                  </dd>
                </div>
                <div>
                  <dt>Recommended action</dt>
                  <dd>
                    {v.action ??
                      "Consult the cited advisory and its remediation guidance."}
                  </dd>
                </div>
              </dl>
              <h2>Affected software</h2>
              <div
                className="table-scroll"
                role="region"
                aria-label="Affected software and versions"
                tabIndex={0}
              >
                <table className="source-table">
                  <thead>
                    <tr>
                      <th>PRODUCT / PACKAGE</th>
                      <th>AFFECTED VERSIONS</th>
                      <th>FIXED VERSIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.affected.map((p, n) => (
                      <tr key={n}>
                        <td>
                          {p.product}
                          <small>{p.ecosystem}</small>
                        </td>
                        <td>{p.versions || "Not specified by this source"}</td>
                        <td>{p.fixed || "Not specified by this source"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h2 style={{ marginTop: 25 }}>Advisory references</h2>
              <ul>
                {v.references
                  .filter((s) => safeUrl(s))
                  .map((url) => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {url} ↗
                      </a>
                    </li>
                  ))}
              </ul>
            </section>
          </>
        )}
        {i && (
          <section className="detail-section" style={{ marginTop: 25 }}>
            <h2>Official incident record</h2>
            <dl className="detail-facts">
              <div>
                <dt>Provider / state</dt>
                <dd>
                  {i.provider} · {i.status}
                </dd>
              </div>
              <div>
                <dt>Affected services</dt>
                <dd>{i.services.join(", ") || "Not specified"}</dd>
              </div>
              <div>
                <dt>Reported start</dt>
                <dd>{stamp(i.startedAt)}</dd>
              </div>
              <div>
                <dt>Latest official update</dt>
                <dd>{stamp(i.updatedAt)}</dd>
              </div>
              <div>
                <dt>Resolution time</dt>
                <dd>{stamp(i.resolvedAt)}</dd>
              </div>
              <div>
                <dt>Last checked</dt>
                <dd>{stamp(story.lastVerified)}</dd>
              </div>
            </dl>
            <p>{i.update ?? "No update text supplied."}</p>
            <p className="notice">
              This is the last collected provider state. Check the original
              status page for newer developments.
            </p>
          </section>
        )}
        <details className="source-disclosure">
          <summary>Sources & methodology</summary>
          <p className="caption">
            Collected from{" "}
            {sources
              .map(({ source }) => source.name)
              .filter((value, index, all) => all.indexOf(value) === index)
              .join(" · ") || "the linked source"}
            . Original reporting belongs to its publisher. Source checked{" "}
            {stamp(story.lastVerified)}.
          </p>
          {sources.map(({ item, source }) => (
            <div className="source-reference" key={item.id}>
              <a
                href={item.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.name}: {item.title} ↗
              </a>
              <p>
                {source.id === "hn" ? "Shared" : "Published"}{" "}
                {stamp(item.publishedAt)} · Checked {stamp(item.lastVerified)}
              </p>
              {item.metadata.discussionUrl && (
                <a
                  href={item.metadata.discussionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join the discussion ({item.metadata.comments ?? 0} comments;{" "}
                  {item.metadata.points ?? 0} points at collection)
                </a>
              )}
              <small>{source.note}</small>
            </div>
          ))}
          <h2>How this story was selected</h2>
          <p>
            Heuristic contributions at ingestion; listing priority also decays
            with age. This is not an objective impact rating.
          </p>
          <ul>
            {story.rankReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p>
            {story.technologyTags.length
              ? `Matched technologies: ${story.technologyTags.join(", ")}`
              : "No watchlist technology matched."}
          </p>
          <Link className="read-link" href="/sources">
            Read the methodology <ArrowUpRight size={14} />
          </Link>
        </details>
      </div>
      {related.length > 0 && (
        <section className="related-section">
          <h2>Keep reading.</h2>
          <div className="related-grid">
            {related.map((s) => (
              <CompactNews key={s.id} story={s} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
