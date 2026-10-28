import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import {
  Empty,
  HealthStrip,
  MethodNote,
  SectionTitle,
  StoryRow,
} from "@/components/editorial";
import { Settings } from "@/components/preferences";
import { Watchlist } from "@/components/watchlist";
import {
  incidentList,
  sourceHealth,
  sourceState,
  stamp,
  storyList,
  vulnerabilityList,
} from "@/lib/queries";
import { technologyNames } from "@/lib/types";
export const dynamic = "force-dynamic";
const sections: Record<
  string,
  { title: string; kicker: string; description: string; category?: string }
> = {
  briefing: {
    title: "Your daily perspective.",
    kicker: "DAILY BRIEFING",
    description:
      "A focused selection from the past 24 hours, organized by theme. Ranking is a transparent editorial heuristic, not an objective measure of importance.",
  },
  latest: {
    title: "The latest developments.",
    kicker: "THE NEWS WIRE",
    description:
      "Recently published reporting and developer updates, collected from our monitored sources.",
  },
  security: {
    title: "Know what needs attention.",
    kicker: "CYBERSECURITY INTELLIGENCE",
    description:
      "Security reporting and official advisories. A reported claim is never upgraded to a confirmed incident by aggregation.",
    category: "security",
  },
  developers: {
    title: "Built for the builders.",
    kicker: "DEVELOPER INTELLIGENCE",
    description:
      "Languages, frameworks, releases, and the ideas shaping software development.",
    category: "developers",
  },
  ai: {
    title: "Beyond the AI headlines.",
    kicker: "AI & EMERGING TECHNOLOGY",
    description:
      "Research, products, and industry developments. Source-linked reporting without the hype.",
    category: "ai",
  },
  community: {
    title: "The developer conversation.",
    kicker: "COMMUNITY PULSE",
    description:
      "Ideas and discussions surfaced from the developer community. Popularity is a discovery signal, not verification.",
    category: "community",
  },
  vulnerabilities: {
    title: "The vulnerability desk.",
    kicker: "SECURITY ADVISORIES",
    description:
      "Official records from CISA, GitHub and OSV. Severity and affected versions are shown only when supplied by the advisory.",
  },
  outages: {
    title: "A pulse on the internet.",
    kicker: "OFFICIAL SERVICE STATUS",
    description:
      "Provider-reported incidents from scheduled collection. No independent probes, uptime guarantees, or real-time monitoring claims.",
  },
  watchlist: {
    title: "Your stack. In focus.",
    kicker: "PERSONAL INTELLIGENCE",
    description:
      "A reading list shaped around the technologies you follow. Saved privately in this browser.",
  },
  search: {
    title: "Find your signal.",
    kicker: "SEARCH & DISCOVERY",
    description:
      "Search collected headlines and previews. Narrow by source, topic, or technology.",
  },
  sources: {
    title: "Nothing without a source.",
    kicker: "TRANSPARENCY & METHODOLOGY",
    description:
      "Where the information comes from, when it was collected, and what we know about its reliability.",
  },
  settings: {
    title: "A briefing that fits you.",
    kicker: "PREFERENCES",
    description: "Control your reading environment. No account required.",
  },
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return { title: sections[section]?.kicker ?? "Not found" };
}
type Search = Record<string, string | string[] | undefined>;
function field(p: Search, key: string) {
  return typeof p[key] === "string" ? (p[key] as string) : "";
}
export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Search>;
}) {
  const { section } = await params;
  const config = sections[section];
  if (!config) notFound();
  const query = await searchParams;
  const sources = await sourceHealth();
  const page = Math.max(1, Math.min(1000, Number(field(query, "page")) || 1));
  const q = field(query, "q").slice(0, 150);
  return (
    <>
      <HealthStrip sources={sources} />
      <div className="page-heading">
        <div className="eyebrow">{config.kicker}</div>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
      </div>
      {section === "settings" ? (
        <Settings />
      ) : section === "watchlist" ? (
        <Watchlist
          initialTab={field(query, "tab") === "saved" ? "saved" : "watching"}
        />
      ) : section === "sources" ? (
        <>
          <div className="table-scroll">
            <table className="source-table">
              <thead>
                <tr>
                  <th>SOURCE / ACCESS</th>
                  <th>COLLECTION</th>
                  <th>LAST SUCCESSFUL SYNC</th>
                  <th>CADENCE</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {s.name} ↗
                        </a>
                      ) : (
                        s.name
                      )}
                      <small>{s.note}</small>
                      {s.docs && (
                        <a
                          className="read-link"
                          href={s.docs}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Source documentation
                        </a>
                      )}
                    </td>
                    <td>
                      <span className={`status-label ${sourceState(s)}`}>
                        {sourceState(s)}
                      </span>
                      {s.lastError && <small>{s.lastError}</small>}
                    </td>
                    <td className="mono">
                      {stamp(s.lastSuccess)}
                      <small>Last attempt: {stamp(s.lastAttempt)}</small>
                    </td>
                    <td className="mono">
                      {s.enabled
                        ? `${s.intervalMinutes / 60} hours`
                        : "Not active"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="methodology">
            <h2>Collected automatically. Explained openly.</h2>
            <p>
              The Signal stores source metadata and short previews. It does not
              republish full articles. RSS excerpts are disabled by default;
              publisher headlines link to original reporting. Optional AI
              output, when enabled, appears separately and cannot verify a
              claim.
            </p>
            <h2>How stories are organized</h2>
            <p>
              Exact canonical URLs are consolidated. Within a 48-hour
              publication window, near-identical headlines may be grouped only
              with strong word overlap and matching version or CVE identifiers.
              Advisory aliases are matched separately. Different service
              incidents retain their provider identifiers. Grouping is
              conservative and can miss paraphrased reporting.
            </p>
            <h2>How priority is calculated</h2>
            <p>
              Source weight contributes up to 20 points, recency up to 30,
              documented exploitation 30, open official incidents 15, and
              community interest up to 10. Stored scores receive an additional
              age penalty when displayed. These are editorial heuristics, not
              factual impact scores. Your watchlist filters by matched
              technology names.
            </p>
            <h2>What the labels mean</h2>
            <p>
              Reported means attributed to a source, not independently
              confirmed. Official advisory means published by the named advisory
              authority. Known exploited is supplied by CISA. Incident labels
              come from the provider: investigating, identified, monitoring,
              resolved, or unknown. A healthy feed connection does not mean all
              services are healthy.
            </p>
            <h2>Freshness and limitations</h2>
            <p>
              GitHub Actions runs on a two-hour schedule and may be delayed.
              Each adapter has its own polling interval. A source becomes stale
              after twice its expected interval. Failed checks are unavailable;
              old incidents are retained with their last verification time. No
              absence of reports proves the absence of disruption.
            </p>
            <p>
              News is retained for 90 days and ingestion logs for 30 days.
              Advisory records are retained for reference. Disabled integrations
              need permission or configuration; they are not claimed as working.
            </p>
          </div>
        </>
      ) : section === "outages" ? (
        await Outages({ sources })
      ) : section === "vulnerabilities" ? (
        await Vulnerabilities({ q, page, severity: field(query, "severity") })
      ) : section === "briefing" ? (
        await Briefing()
      ) : (
        await News({ section, config, query, sources, page, q })
      )}
    </>
  );
}
async function News({
  section,
  config,
  query,
  sources,
  page,
  q,
}: {
  section: string;
  config: (typeof sections)[string];
  query: Search;
  sources: Awaited<ReturnType<typeof sourceHealth>>;
  page: number;
  q: string;
}) {
  const category = config.category || field(query, "category");
  const data = await storyList({
    category: category || undefined,
    kind: section === "security" ? undefined : "news",
    query: q || undefined,
    technology: field(query, "technology") || undefined,
    source: field(query, "source") || undefined,
    page,
    order: field(query, "order") === "rank" ? "rank" : "latest",
  });
  const next = (n: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query))
      if (typeof v === "string") params.set(k, v);
    params.set("page", String(n));
    return `/${section}?${params}`;
  };
  return (
    <>
      <form className="filter-form" action={`/${section}`}>
        <label>
          SEARCH
          <input
            name="q"
            defaultValue={q}
            placeholder="A headline, product, or topic"
            maxLength={150}
          />
        </label>
        <label>
          TECHNOLOGY
          <select name="technology" defaultValue={field(query, "technology")}>
            <option value="">All technologies</option>
            {technologyNames.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          SOURCE
          <select name="source" defaultValue={field(query, "source")}>
            <option value="">All sources</option>
            {sources
              .filter((s) => s.enabled && s.kind !== "status")
              .map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
        {!config.category && (
          <label>
            TOPIC
            <select name="category" defaultValue={category}>
              <option value="">All topics</option>
              {["technology", "security", "developers", "ai", "community"].map(
                (t) => (
                  <option key={t}>{t}</option>
                ),
              )}
            </select>
          </label>
        )}
        <label>
          SORT
          <select name="order" defaultValue={field(query, "order") || "latest"}>
            <option value="latest">Newest first</option>
            <option value="rank">Editorial priority</option>
          </select>
        </label>
        <button className="dark-button" type="submit">
          Apply filters <ArrowRight size={14} />
        </button>
      </form>
      <div className="content-grid">
        <section>
          <p className="count-label">
            {data.total} matching stories · Page {page}
          </p>
          {data.error ? (
            <p role="alert" className="notice">
              {data.error}
            </p>
          ) : data.rows.length ? (
            data.rows.map((s) => <StoryRow key={s.id} story={s} />)
          ) : (
            <Empty title="No matching stories." />
          )}
          <div className="pagination">
            {page > 1 ? (
              <Link href={next(page - 1)}>← Previous</Link>
            ) : (
              <span />
            )}
            {page * 24 < data.total && (
              <Link href={next(page + 1)}>Next page →</Link>
            )}
          </div>
        </section>
        <aside>
          <h2>A useful filter is a quiet one.</h2>
          <p>
            Follow your technologies to build a focused view of the same
            source-linked intelligence.
          </p>
          <Link href="/watchlist" className="read-link">
            Set up your watchlist <ArrowUpRight size={14} />
          </Link>
          <MethodNote />
        </aside>
      </div>
    </>
  );
}
async function Briefing() {
  const since = new Date(new Date().getTime() - 86400000);
  const groups = [
    ["Technology developments", { category: "technology", kind: "news" }],
    ["Cybersecurity announcements", { category: "security", kind: "news" }],
    ["Software vulnerabilities", { kind: "vulnerability" }],
    ["Service disruptions", { kind: "incident" }],
    ["Developer ecosystem", { category: "developers", kind: "news" }],
    ["Community discussions", { category: "community", kind: "news" }],
    ["AI & emerging technology", { category: "ai", kind: "news" }],
  ] as const;
  const data = await Promise.all(
    groups.map(async ([name, filter]) => ({
      name,
      ...(await storyList({ ...filter, since, order: "rank" })),
    })),
  );
  return (
    <div className="content-grid">
      <div>
        <p className="notice">
          Rolling 24-hour briefing · Publication time is used when supplied;
          otherwise the documented event time or first collection time. Empty
          sections mean no matching records were collected.
        </p>
        {data.map((g, i) => (
          <section key={g.name} style={{ marginTop: 32 }}>
            <SectionTitle
              label={g.name}
              index={String(i + 1).padStart(2, "0")}
            />
            {g.error ? (
              <p className="notice">{g.error}</p>
            ) : g.rows.length ? (
              g.rows
                .slice(0, 5)
                .map((s) => <StoryRow key={s.id} story={s} compact />)
            ) : (
              <p className="muted">No collected developments in this window.</p>
            )}
          </section>
        ))}
      </div>
      <aside>
        <h2>The daily reading habit.</h2>
        <p>
          Each section prioritizes source weight, recency and documented impact.
          Community attention adds context, not confirmation.
        </p>
        <MethodNote />
        <Link href="/watchlist" className="rail-link">
          Follow your technologies <ArrowRight size={14} />
        </Link>
      </aside>
    </div>
  );
}
async function Vulnerabilities({
  q,
  page,
  severity,
}: {
  q: string;
  page: number;
  severity: string;
}) {
  const rows = await vulnerabilityList(q, page, severity);
  return (
    <>
      <form className="filter-form">
        <label>
          SEARCH ADVISORIES
          <input
            name="q"
            defaultValue={q}
            placeholder="CVE identifier or advisory title"
          />
        </label>
        <label>
          OFFICIAL SEVERITY
          <select name="severity" defaultValue={severity}>
            <option value="">All severities</option>
            {["critical", "high", "medium", "low"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button className="dark-button">
          Search records <ArrowRight size={14} />
        </button>
      </form>
      <p className="notice">
        Known exploitation and severity are different signals. Missing severity
        is shown as unknown; OSV vectors are not converted into invented numeric
        scores. A fixed version is not inferred when the advisory does not
        specify one.
      </p>
      <div className="table-scroll">
        <table className="source-table">
          <thead>
            <tr>
              <th>ADVISORY</th>
              <th>SEVERITY</th>
              <th>EXPLOITATION</th>
              <th>PUBLISHED / CATALOG EVENT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ story, record }) => (
              <tr key={story.id}>
                <td>
                  <Link className="read-link" href={`/story/${story.slug}`}>
                    {record.identifier} <ArrowUpRight size={13} />
                  </Link>
                  <small>{story.title}</small>
                </td>
                <td>
                  <span
                    className={`severity ${record.details.severity?.toLowerCase() === "critical" ? "critical" : ""}`}
                  >
                    {record.details.severity ?? "Unknown"}
                  </span>
                  <small>
                    {record.details.cvss !== null
                      ? `CVSS ${record.details.cvss}`
                      : "No numeric score supplied"}
                    {record.details.withdrawn ? " · Withdrawn" : ""}
                  </small>
                </td>
                <td className="mono">{record.details.exploitation}</td>
                <td className="mono">
                  {stamp(story.publishedAt ?? story.eventAt)}
                  <small>
                    {story.publishedAt
                      ? "Advisory publication"
                      : "Catalog / modification event"}
                  </small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <Empty title="No advisory records available." />}
      <div className="pagination">
        {page > 1 ? (
          <Link
            href={`/vulnerabilities?q=${encodeURIComponent(q)}&severity=${encodeURIComponent(severity)}&page=${page - 1}`}
          >
            ← Previous
          </Link>
        ) : (
          <span />
        )}
        {rows.length === 25 && (
          <Link
            href={`/vulnerabilities?q=${encodeURIComponent(q)}&severity=${encodeURIComponent(severity)}&page=${page + 1}`}
          >
            Next →
          </Link>
        )}
      </div>
    </>
  );
}
async function Outages({
  sources,
}: {
  sources: Awaited<ReturnType<typeof sourceHealth>>;
}) {
  const rows = await incidentList();
  const providers = sources.filter((s) => s.kind === "status");
  const active = rows.filter((r) => r.record.status !== "resolved");
  return (
    <>
      <p className="notice">
        A source marked unavailable or stale means we cannot establish its
        current incident state. It is not a confirmed provider outage. Last
        known reports remain visible below.
      </p>
      <div className="provider-summary">
        {providers.map((s) => (
          <div key={s.id}>
            <h2>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.name} ↗
              </a>
            </h2>
            <span className={`status-label ${sourceState(s)}`}>
              {sourceState(s) === "current" ? "Feed current" : sourceState(s)}
            </span>
            <small>Verified {stamp(s.lastSuccess)}</small>
            <small>
              {s.enabled
                ? `Checks every ${s.intervalMinutes / 60} hours`
                : "Not configured"}
            </small>
          </div>
        ))}
      </div>
      <SectionTitle label="Open & unresolved reports" />
      {!active.length && (
        <Empty title="No current confirmed incidents in stored reports.">
          This only describes the monitored sources and their last successful
          checks. Review the collection status above for gaps.
        </Empty>
      )}
      <div className="incident-grid">
        {active.map(({ story, record }) => {
          const source = providers.find((s) => s.name === record.provider);
          return (
            <article className="incident-panel" key={story.id}>
              <div className="eyebrow">
                {record.provider}
                <span className={`status-label ${record.status}`}>
                  {record.status === "investigating"
                    ? "Under investigation"
                    : record.status}
                </span>
              </div>
              <h3>
                <Link href={`/story/${story.slug}`}>{story.title}</Link>
              </h3>
              {source && sourceState(source) !== "current" && (
                <p className="notice">
                  Last known state · Source {sourceState(source)}
                </p>
              )}
              <p>{record.details.update || "No update text supplied."}</p>
              <div className="incident-meta">
                <span>Started {stamp(record.details.startedAt)}</span>
                <span>Updated {stamp(record.details.updatedAt)}</span>
              </div>
              <Link href={`/story/${story.slug}`} className="rail-link">
                Official update & provenance <ArrowUpRight size={14} />
              </Link>
            </article>
          );
        })}
      </div>
      <div style={{ marginTop: 35 }}>
        <SectionTitle label="Recently resolved" />
      </div>
      {rows
        .filter((r) => r.record.status === "resolved")
        .slice(0, 15)
        .map(({ story, record }) => (
          <article key={story.id} className="story-row">
            <div className="story-row-body">
              <div className="eyebrow">
                {record.provider}
                <span className="status-label resolved">Resolved</span>
              </div>
              <h3>
                <Link href={`/story/${story.slug}`}>{story.title}</Link>
              </h3>
              <p className="story-meta">
                Resolved {stamp(record.details.resolvedAt)} · Last verified{" "}
                {stamp(story.lastVerified)}
              </p>
            </div>
          </article>
        ))}
    </>
  );
}
