import manifest from "@/data/visuals.json";
import type { Story } from "./db/schema";
export type EditorialVisual = {
  id: string;
  relatedStory: string;
  subject: string;
  kind: "photograph" | "screenshot" | "archival" | "illustration" | "chart";
  src: string;
  sourceUrl: string;
  creator: string;
  rightsHolder: string;
  caption: string;
  credit: string;
  license: string;
  permissionRecord: string;
  alt: string;
  verification: "pending" | "verified" | "rejected";
  verifiedAt: string | null;
  width: number;
  height: number;
  focalPoint: { x: number; y: number };
  cropReviewed: boolean;
};
export type IllustrationTheme =
  "device" | "ai" | "security" | "code" | "dns" | "planning";
export function approvedVisual(value: EditorialVisual): boolean {
  return (
    value.verification === "verified" &&
    Boolean(
      value.verifiedAt && Number.isFinite(Date.parse(value.verifiedAt)),
    ) &&
    value.cropReviewed &&
    value.src.startsWith("/media/") &&
    !value.src.includes("..") &&
    Boolean(
      value.sourceUrl &&
      value.creator &&
      value.rightsHolder &&
      value.caption &&
      value.credit &&
      value.license &&
      value.permissionRecord &&
      value.alt &&
      value.subject &&
      value.relatedStory,
    ) &&
    value.width > 0 &&
    value.height > 0 &&
    [value.focalPoint.x, value.focalPoint.y].every(
      (n) => Number.isFinite(n) && n >= 0 && n <= 1,
    )
  );
}
export function visualFor(
  story: Pick<Story, "id" | "canonicalUrl">,
): EditorialVisual | null {
  return (
    (manifest as EditorialVisual[]).find(
      (v) =>
        (v.relatedStory === story.canonicalUrl ||
          v.relatedStory === story.id) &&
        approvedVisual(v),
    ) ?? null
  );
}
export function illustrationFor(
  story: Pick<Story, "title" | "category" | "technologyTags">,
): IllustrationTheme | null {
  const title = story.title.toLowerCase();
  if (/\bdns\b/.test(title)) return "dns";
  if (
    /\b(datacenters?|data centers?)\b/.test(title) &&
    /\b(planning|whitehall|build|government)\b/.test(title)
  )
    return "planning";
  if (/\b(phone|android|iphone|smartphone|ios)\b/.test(title)) return "device";
  if (
    /\b(ai|chatgpt|claude|llm|openai|anthropic|machine learning)\b/.test(
      title,
    ) ||
    story.category === "ai"
  )
    return "ai";
  if (
    /\b(security|cyber|hackers?|vulnerability|exploit|ransomware|breach)\b/.test(
      title,
    ) ||
    story.category === "security"
  )
    return "security";
  if (story.category === "developers" || story.technologyTags.length)
    return "code";
  return null;
}
export const illustrationNotes: Record<
  IllustrationTheme,
  { subject: string; alt: string; caption: string }
> = {
  device: {
    subject: "Device access and control",
    alt: "An original cut-paper-style illustration of a phone, a key and an open doorway.",
    caption:
      "Device access, interpreted in paper and ink. An editorial illustration, not a depiction of the reported event.",
  },
  ai: {
    subject: "Artificial intelligence",
    alt: "An original diagram with input, a model and output connected by a winding path.",
    caption:
      "A simplified input–model–output diagram. It illustrates the topic, not the architecture or behavior of a specific product.",
  },
  security: {
    subject: "Software security",
    alt: "An original abstract illustration of a key passing through nested software boundaries.",
    caption:
      "Software boundaries and access, in an original editorial illustration. No attack or affected system is reconstructed.",
  },
  code: {
    subject: "Software development",
    alt: "An original illustration of connected code modules, brackets and a branching path.",
    caption:
      "Code and dependencies, interpreted as connected shapes. An original illustration, not a screenshot of a product.",
  },
  dns: {
    subject: "Domain name lookup",
    alt: "A reader asks a DNS resolver for the address of a website. The resolver returns an address; the browser then connects to the destination. General explanation, not evidence of a block.",
    caption:
      "DNS turns a website name into an address. A simplified concept diagram; it does not depict an active block or verify the reported proposal. Based on RFC 1034.",
  },
  planning: {
    subject: "Datacenters and planning paperwork",
    alt: "A stack of planning papers beside server cabinets, connected by an unfinished dotted route. A conceptual illustration, not a map of government procedure.",
    caption:
      "Paperwork meets infrastructure. An original conceptual illustration, not a reconstruction of a planning decision or government process.",
  },
};
