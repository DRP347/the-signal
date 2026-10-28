import type { Story } from "./db/schema";
export type Attribution = { name: string; url: string };
export type EditorialStory = Story & { attribution?: Attribution[] };

export const topics = [
  {
    href: "/search?category=technology",
    label: "Technology",
    category: "technology",
    description: "The products, platforms and infrastructure around us.",
  },
  {
    href: "/ai",
    label: "AI & ideas",
    category: "ai",
    description: "Research, tools and the questions they raise.",
  },
  {
    href: "/security",
    label: "Security",
    category: "security",
    description: "Reporting and official security advisories.",
  },
  {
    href: "/developers",
    label: "Developers",
    category: "developers",
    description: "The craft and tools of building software.",
  },
  {
    href: "/community",
    label: "Culture & community",
    category: "community",
    description: "Ideas and conversations from across the internet.",
  },
] as const;
export function topicLabel(category: string) {
  return topics.find((t) => t.category === category)?.label ?? category;
}
export function selectEdition(pool: EditorialStory[], leadUrl?: string) {
  const distinct = [
    ...new Map(
      pool.filter((s) => s.kind === "news").map((s) => [s.id, s]),
    ).values(),
  ];
  // An explicit edition choice may retain a lead; imagery never changes priority.
  const lead =
    distinct.find((s) => s.canonicalUrl === leadUrl) ?? distinct[0] ?? null;
  const secondary = distinct.filter((s) => s.id !== lead?.id).slice(0, 2);
  const used = new Set([lead, ...secondary].filter(Boolean).map((s) => s!.id));
  // Reserve real topic collections, then offer a mix of topics in the brief.
  const collections = topics
    .map((topic) => ({
      ...topic,
      stories: distinct
        .filter((s) => s.category === topic.category && !used.has(s.id))
        .slice(0, 2),
    }))
    .filter((topic) => topic.stories.length > 0)
    .slice(0, 2);
  collections.flatMap((c) => c.stories).forEach((s) => used.add(s.id));
  const briefing: EditorialStory[] = [];
  const take = (s: EditorialStory) => {
    briefing.push(s);
    used.add(s.id);
  };
  for (const topic of topics) {
    const next = distinct.find(
      (s) => s.category === topic.category && !used.has(s.id),
    );
    if (next) take(next);
  }
  for (const s of distinct) {
    if (briefing.length >= 6) break;
    if (!used.has(s.id)) take(s);
  }
  return { lead, secondary, briefing, collections };
}
export function calendarDate(value: Date | string | null | undefined) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value))
    : "Date not supplied";
}
export function sourceLabel(story: EditorialStory) {
  return (
    story.attribution
      ?.map((a) => a.name)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(" + ") || publisherLabel(story)
  );
}
export function publisherLabel(story: Pick<Story, "canonicalUrl">) {
  try {
    return new URL(story.canonicalUrl).hostname.replace(/^www\./, "");
  } catch {
    return "Original source";
  }
}
export function dateLabel(story: EditorialStory) {
  return story.attribution?.some((a) => a.name === "Hacker News")
    ? "Shared"
    : "Published";
}
