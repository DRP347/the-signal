import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Radio,
  ShieldCheck,
} from "lucide-react";
import type { Story, Source } from "@/lib/db/schema";
import { sourceState, stamp } from "@/lib/queries";
import { BookmarkButton } from "./preferences";
export function Empty({
  title = "Nothing to report yet.",
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <Radio size={23} strokeWidth={1.3} />
      <h3>{title}</h3>
      <p>
        {children ??
          "No matching records are available from the monitored sources. The next successful collection will appear here."}
      </p>
      <Link href="/sources">
        View source health <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
export function SectionTitle({
  label,
  href,
  action = "View all",
  index,
}: {
  label: string;
  href?: string;
  action?: string;
  index?: string;
}) {
  return (
    <div className="section-title">
      <h2>
        {index && <span>{index}</span>}
        {label}
      </h2>
      {href && (
        <Link href={href}>
          {action} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
export function StoryRow({
  story,
  index,
  compact = false,
}: {
  story: Story;
  index?: number;
  compact?: boolean;
}) {
  return (
    <article className={`story-row ${compact ? "compact" : ""}`}>
      {index !== undefined && (
        <span className="story-index">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <div className="story-row-body">
        <div className="eyebrow">
          <span>{story.category}</span>
          <span className="muted">
            {story.sourceCount} source{story.sourceCount !== 1 ? "s" : ""}
          </span>
        </div>
        <h3>
          <Link href={`/story/${story.slug}`}>{story.title}</Link>
        </h3>
        {!compact && story.preview && <p>{story.preview}</p>}
        <div className="story-meta">
          <Clock3 size={12} />
          <time
            dateTime={
              story.publishedAt
                ? new Date(story.publishedAt).toISOString()
                : story.eventAt
                  ? new Date(story.eventAt).toISOString()
                  : undefined
            }
          >
            {stamp(story.publishedAt ?? story.eventAt)}
          </time>
          {story.technologyTags.slice(0, 2).map((tag) => (
            <Link
              className="tag"
              href={`/search?technology=${encodeURIComponent(tag)}`}
              key={tag}
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>
      <BookmarkButton id={story.id} />
    </article>
  );
}
export function HealthStrip({ sources }: { sources: Source[] }) {
  const active = sources.filter((s) => s.enabled),
    current = active.filter((s) => sourceState(s) === "current");
  const latest = active
    .map((s) => s.lastSuccess)
    .filter((d): d is Date => !!d)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  return (
    <div className="health-strip">
      <span>
        <span className={`status-dot ${current.length ? "green" : ""}`} />
        {current.length}/{active.length} sources current
      </span>
      <span>
        Last collected <strong>{stamp(latest)}</strong>
      </span>
      <Link href="/sources">
        Collection status <ArrowUpRight size={13} />
      </Link>
    </div>
  );
}
export function MethodNote() {
  return (
    <div className="method-note">
      <ShieldCheck size={20} />
      <div>
        <strong>Context, with provenance.</strong>
        <p>
          Ranked by recency, source weight and documented impact. Previews are
          source metadata, not AI summaries. Every story links back to its
          origin.
        </p>
        <Link href="/sources">
          How The Signal works <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
}
