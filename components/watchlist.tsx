"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  BookmarkButton,
  WatchControls,
  parseList,
  useStored,
} from "./preferences";
type Row = {
  id: string;
  slug: string;
  title: string;
  category: string;
  publishedAt: string | null;
  preview: string;
};
export function Watchlist({
  initialTab = "watching",
}: {
  initialTab?: "watching" | "saved";
}) {
  const watched = useStored("signal-watchlist", "[]"),
    saved = useStored("signal-bookmarks", "[]");
  const [tab, setTab] = useState(initialTab);
  const [data, setData] = useState<{
    rows: Row[];
    total: number;
    error?: string | null;
  }>({ rows: [], total: 0 });
  const [pending, setPending] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => {
    const controller = new AbortController();
    const ids = parseList(tab === "watching" ? watched : saved);
    if (!ids.length) return;
    const run = async () => {
      setPending(true);
      try {
        const r = await fetch(
          `/api/stories?${tab === "watching" ? "technologies" : "bookmarks"}=${encodeURIComponent(ids.join(","))}&page=${page}`,
          { signal: controller.signal },
        );
        if (!r.ok)
          throw new Error("Reading list unavailable. Please try again.");
        setData(await r.json());
      } catch (error) {
        if (!controller.signal.aborted)
          setData({ rows: [], total: 0, error: String(error) });
      } finally {
        if (!controller.signal.aborted) setPending(false);
      }
    };
    void run();
    return () => controller.abort();
  }, [watched, saved, tab, page]);
  const empty = parseList(tab === "watching" ? watched : saved).length === 0;
  return (
    <>
      <WatchControls />
      <div className="tabs" role="tablist" aria-label="Reading list">
        <button
          role="tab"
          aria-selected={tab === "watching"}
          id="tab-watching"
          aria-controls="reading-panel"
          tabIndex={tab === "watching" ? 0 : -1}
          onKeyDown={(e) => {
            if (["ArrowLeft", "ArrowRight", "End"].includes(e.key)) {
              e.preventDefault();
              setTab("saved");
              setPage(1);
              document.getElementById("tab-saved")?.focus();
            }
          }}
          onClick={() => {
            setTab("watching");
            setPage(1);
          }}
        >
          Following ({parseList(watched).length})
        </button>
        <button
          role="tab"
          aria-selected={tab === "saved"}
          id="tab-saved"
          aria-controls="reading-panel"
          tabIndex={tab === "saved" ? 0 : -1}
          onKeyDown={(e) => {
            if (["ArrowLeft", "ArrowRight", "Home"].includes(e.key)) {
              e.preventDefault();
              setTab("watching");
              setPage(1);
              document.getElementById("tab-watching")?.focus();
            }
          }}
          onClick={() => {
            setTab("saved");
            setPage(1);
          }}
        >
          Saved stories ({parseList(saved).length})
        </button>
      </div>
      <div
        id="reading-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        tabIndex={0}
        aria-live="polite"
      >
        {empty ? (
          <div className="empty-state">
            <h3>
              {tab === "watching"
                ? "Start with your stack."
                : "Your reading list starts here."}
            </h3>
            <p>
              {tab === "watching"
                ? "Select a technology above to see related stories."
                : "Use the bookmark button on any story to save it on this device."}
            </p>
          </div>
        ) : pending ? (
          <p role="status">Loading your reading list…</p>
        ) : data.error ? (
          <p role="alert" className="notice">
            {data.error}
          </p>
        ) : !data.rows.length ? (
          <div className="empty-state">
            <h3>No matching stories yet.</h3>
            <p>
              New matching records will appear after scheduled collection. Old
              bookmarks may refer to records outside the retention window.
            </p>
          </div>
        ) : (
          data.rows.map((s) => (
            <article className="story-row" key={s.id}>
              <div className="story-row-body">
                <div className="eyebrow">{s.category}</div>
                <h3>
                  <Link href={`/story/${s.slug}`}>{s.title}</Link>
                </h3>
                <p>{s.preview}</p>
                <Link className="read-link" href={`/story/${s.slug}`}>
                  Read source details <ArrowUpRight size={14} />
                </Link>
              </div>
              <BookmarkButton id={s.id} />
            </article>
          ))
        )}
      </div>
      {!empty && (
        <div className="pagination">
          <button
            className="outline-button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            className="outline-button"
            disabled={page * 24 >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
