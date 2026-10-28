export const technologyNames = [
  "React",
  "Next.js",
  "Node.js",
  "PHP",
  "Laravel",
  "WordPress",
  "TypeScript",
  "Python",
  "PostgreSQL",
  "GitHub",
  "Docker",
  "Kubernetes",
] as const;
export type Category =
  "technology" | "security" | "developers" | "ai" | "community";
export type Vulnerability = {
  identifiers: string[];
  severity: string | null;
  cvss: number | null;
  affected: {
    product: string;
    ecosystem?: string;
    versions?: string;
    fixed?: string;
  }[];
  exploitation: "known exploited" | "unknown";
  action: string | null;
  references: string[];
  withdrawn?: boolean;
};
export type Incident = {
  provider: string;
  services: string[];
  status:
    "investigating" | "identified" | "monitoring" | "resolved" | "unknown";
  startedAt: string | null;
  updatedAt: string | null;
  resolvedAt: string | null;
  update: string | null;
};
export type Item = {
  externalId: string;
  title: string;
  url: string;
  publishedAt: string | null;
  eventAt?: string | null;
  preview?: string;
  category?: Category;
  technologies?: string[];
  discussionUrl?: string;
  points?: number;
  comments?: number;
  vulnerability?: Vulnerability;
  incident?: Incident;
};
export type SourceDefinition = {
  id: string;
  name: string;
  kind: "community" | "editorial" | "official" | "advisory" | "status";
  url: string;
  endpoint: string;
  docs: string;
  intervalMinutes: number;
  credibility: number;
  enabled: boolean;
  note: string;
  adapter:
    | "hn"
    | "dev"
    | "kev"
    | "osv"
    | "github"
    | "rss"
    | "statuspage"
    | "google"
    | "aws"
    | "optional";
};
export type SourceContext = {
  lastSuccess: Date | null;
  cursor: string | null;
  etag: string | null;
  lastModified: string | null;
};
export type AdapterResult = {
  items: Item[];
  cursor?: string;
  etag?: string | null;
  lastModified?: string | null;
  notModified?: boolean;
};
