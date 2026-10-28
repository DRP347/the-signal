import type { FullArticle } from "@/lib/article-content";
export function ArticleBody({ article }: { article: FullArticle }) {
  return (
    <div className="full-article-body">
      {article.blocks.map((block, index) =>
        block.type === "heading" ? (
          <h2 key={index}>{block.text}</h2>
        ) : (
          <p key={index}>{block.text}</p>
        ),
      )}
      <section
        className="article-source-notes"
        aria-label="Article source notes"
      >
        <h2>Sources & notes</h2>
        <ul>
          {article.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.title} ↗
              </a>
            </li>
          ))}
        </ul>
        <p>{article.rights.record}</p>
      </section>
    </div>
  );
}
