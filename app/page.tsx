import Link from "next/link";
import editionChoice from "@/data/edition.json";
import { ArrowRight } from "lucide-react";
import { overview, storyList, stamp } from "@/lib/queries";
import { selectEdition, topics } from "@/lib/editorial";
import {
  LeadStory,
  SecondaryStory,
  CompactNews,
  NewspaperSection,
  StoryVisual,
} from "@/components/newspaper";
import { Empty } from "@/components/editorial";
import { WatchControls } from "@/components/preferences";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [data, latest, ai] = await Promise.all([
    overview(),
    storyList({ kind: "news", order: "latest" }),
    storyList({ category: "ai", kind: "news", order: "rank" }),
  ]);
  const edition = selectEdition(
    [
      ...data.news.rows,
      ...latest.rows,
      ...data.security.rows,
      ...data.developer.rows,
      ...ai.rows,
      ...data.community.rows,
    ],
    editionChoice.leadUrl,
  );
  const lastSync = data.sources
    .map((s) => s.lastSuccess)
    .filter(Boolean)
    .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];
  return (
    <div className="edition">
      <div className="front-dateline">
        <span>
          <span className="edition-star" aria-hidden="true">
            ✳
          </span>{" "}
          The front page
        </span>
        <p>
          Last collected {stamp(lastSync)}{" "}
          <Link href="/sources">Source notes ↗</Link>
        </p>
      </div>
      {edition.lead ? (
        <section className="front-page-grid" aria-label="The Lead">
          <LeadStory story={edition.lead} />
          <aside
            className="front-secondary"
            aria-label="Also worth your attention"
          >
            <p className="rail-label">Also in the news</p>
            {edition.secondary.map((s) => (
              <SecondaryStory key={s.id} story={s} />
            ))}
            <div className="margin-note">
              <p>
                A wider view.
                <br />
                <em>A clearer signal.</em>
              </p>
              <span>
                Reporting from around the web, with a path back to every source.
              </span>
              <Link href="/sources">
                How we choose stories <ArrowRight size={16} />
              </Link>
            </div>
          </aside>
        </section>
      ) : (
        <>
          <h1 className="empty-title">The front page is taking shape.</h1>
          <Empty>
            {data.news.error ??
              "No stories have been collected yet. Check our source directory for collection status."}
          </Empty>
        </>
      )}
      <section className="daily-brief" aria-labelledby="daily-title">
        <NewspaperSection
          title="The Daily Brief"
          id="daily-title"
          note="A few more stories worth your attention."
          href="/briefing"
          action="Daily edition"
        />
        <div className="daily-list">
          {edition.briefing.map((s, i) => (
            <CompactNews key={s.id} story={s} number={i + 1} />
          ))}
          {!edition.briefing.length && (
            <Empty title="You’re up to date with this collection." />
          )}
        </div>
      </section>
      {edition.collections.length > 0 && (
        <section className="go-deeper" aria-labelledby="deeper-title">
          <NewspaperSection
            title="Go Deeper"
            id="deeper-title"
            note="Follow a topic through its original sources."
          />
          <div className="collection-grid">
            {edition.collections.map((topic) => (
              <div className="topic-collection" key={topic.category}>
                <div className="collection-heading">
                  <span className="kicker">A reading collection</span>
                  <h3>
                    <Link href={topic.href}>
                      {topic.label} <ArrowRight size={20} />
                    </Link>
                  </h3>
                  <p>{topic.description}</p>
                </div>
                <StoryVisual story={topic.stories[0]} />
                {topic.stories.map((s) => (
                  <CompactNews key={s.id} story={s} headingLevel={4} />
                ))}
                <Link href={topic.href} className="editorial-link">
                  All {topic.label.toLowerCase()} stories{" "}
                  <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
      <nav className="browse-topics" aria-label="Browse all coverage">
        <span>Find your corner</span>
        {topics.map((t) => (
          <Link href={t.href} key={t.category}>
            {t.label}
          </Link>
        ))}
        <Link href="/outages">Service status</Link>
        <Link href="/vulnerabilities">Security advisories</Link>
      </nav>
      <section className="reading-list-invitation">
        <div>
          <h2>
            Your interests. <em>Your Signal.</em>
          </h2>
          <p>
            Follow the technologies you care about. Keep good stories for later.
          </p>
          <Link href="/watchlist" className="editorial-link">
            Your reading list <ArrowRight size={17} />
          </Link>
        </div>
        <details>
          <summary>Choose your technologies</summary>
          <WatchControls />
          <p className="caption">
            Saved in this browser. No account or tracking.
          </p>
        </details>
      </section>
    </div>
  );
}
