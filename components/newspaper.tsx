import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import {
  type EditorialStory,
  calendarDate,
  sourceLabel,
  publisherLabel,
  dateLabel,
  topicLabel,
} from "@/lib/editorial";
import { illustrationFor, illustrationNotes, visualFor } from "@/lib/visuals";
import { Illustration } from "./illustration";
import { VerifiedImage } from "./visual-media";
import { BookmarkButton } from "./preferences";
import { articleFor, contentLabel } from "@/lib/article-content";
export function StoryVisual({
  story,
  priority = false,
}: {
  story: EditorialStory;
  priority?: boolean;
}) {
  const approved = visualFor(story);
  if (approved) return <VerifiedImage visual={approved} priority={priority} />;
  const theme = illustrationFor(story);
  if (!theme) return null;
  return (
    <figure className="story-visual">
      <Illustration theme={theme} />
      <figcaption>{illustrationNotes[theme].caption}</figcaption>
    </figure>
  );
}
export function StoryCredit({
  story,
  showDate = true,
}: {
  story: EditorialStory;
  showDate?: boolean;
}) {
  const publisher = publisherLabel(story),
    collected = sourceLabel(story);
  return (
    <div className="publication-credit">
      <span>{publisher}</span>
      {showDate && (
        <>
          <i aria-hidden="true">·</i>
          <time
            dateTime={
              story.publishedAt
                ? new Date(story.publishedAt).toISOString()
                : undefined
            }
          >
            {story.publishedAt
              ? `${dateLabel(story)} ${calendarDate(story.publishedAt)}`
              : "Publication date not supplied"}
          </time>
        </>
      )}
      {collected !== publisher && (
        <span className="collected-via">Via {collected}</span>
      )}
    </div>
  );
}
export function EditorialDeck({ story }: { story: EditorialStory }) {
  return story.preview ? (
    <p className="editorial-deck">
      <span className="excerpt-label">Source excerpt · </span>
      {story.preview}
    </p>
  ) : null;
}
export function LeadStory({ story }: { story: EditorialStory }) {
  return (
    <article className="front-lead">
      <div className="kicker">
        The Lead <span>/ {topicLabel(story.category)}</span>
      </div>
      <h1>
        <Link href={`/story/${story.slug}`}>{story.title}</Link>
      </h1>
      <EditorialDeck story={story} />
      <StoryCredit story={story} />
      <StoryVisual story={story} priority />
      <div className="story-foot">
        <Link className="editorial-link" href={`/story/${story.slug}`}>
          {articleFor(story)
            ? "Read the article"
            : "View source & original reporting"}
          <ArrowRight size={18} />
        </Link>
        <BookmarkButton id={story.id} />
      </div>
    </article>
  );
}
export function SecondaryStory({ story }: { story: EditorialStory }) {
  return (
    <article className="secondary-story">
      <div className="kicker">{topicLabel(story.category)}</div>
      <h2>
        <Link href={`/story/${story.slug}`}>{story.title}</Link>
      </h2>
      <StoryCredit story={story} />
      <span className="content-label">{contentLabel(story)}</span>
    </article>
  );
}
export function CompactNews({
  story,
  number,
  headingLevel = 3,
}: {
  story: EditorialStory;
  number?: number;
  headingLevel?: 3 | 4;
}) {
  const Heading = headingLevel === 4 ? "h4" : "h3";
  return (
    <article className="compact-news">
      {number !== undefined && (
        <span className="brief-number" aria-hidden="true">
          {String(number).padStart(2, "0")}
        </span>
      )}
      <div>
        <div className="kicker">{topicLabel(story.category)}</div>
        <Heading>
          <Link href={`/story/${story.slug}`}>{story.title}</Link>
        </Heading>
        <EditorialDeck story={story} />
        <StoryCredit story={story} />
        <span className="content-label">{contentLabel(story)}</span>
      </div>
    </article>
  );
}
export function NewspaperSection({
  title,
  id,
  note,
  href,
  action = "Explore",
}: {
  title: string;
  id?: string;
  note?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="newspaper-section-heading">
      <div>
        <h2 id={id}>
          {title}
          <span>.</span>
        </h2>
        {note && <p>{note}</p>}
      </div>
      {href && (
        <Link href={href}>
          {action}
          <ArrowUpRight size={17} />
        </Link>
      )}
    </div>
  );
}
