import { useParams } from "react-router-dom";

import { BackButton } from "~/components/layout/BackButton";
import { Icon } from "~/components/ui/Icon";
import { useFavorites } from "~/content/FavoritesProvider";
import { mediaUrl } from "~/lib/api";
import { timeAgo } from "~/lib/format";
import { findArticle } from "~/lib/news";
import { useGoBack } from "~/lib/navigation";
import type { ArticleBlock } from "~/lib/types";

/**
 * Article reader. Nested under the News tab — opening a story pushes this screen
 * over the tab bar, the same way the event detail page pushes.
 */
export function ArticleScreen() {
  const { slug = "" } = useParams();
  const goBack = useGoBack("/news");
  const article = findArticle(slug);
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = article ? isFavorite("news", article.slug) : false;

  if (!article) {
    return (
      <div className="px-5 pt-2">
        <BackButton onClick={goBack} tone="dark" label="Back to News" />
        <p className="mt-6 text-[14px] leading-relaxed text-muted">
          That story is no longer in the edition.
        </p>
      </div>
    );
  }

  return (
    <article className="pb-8">
      <div className="flex items-center justify-between px-5 pt-2">
        <BackButton onClick={goBack} tone="dark" label="Back to News" />
        {article ? (
          <button
            type="button"
            onClick={() => toggleFavorite("news", article.slug)}
            aria-label={saved ? "Remove story from favorites" : "Save this story"}
            aria-pressed={saved}
            className="grid h-10 w-10 place-items-center rounded-full text-ink transition active:scale-95"
          >
            <Icon name="heart" size={21} filled={saved} className={saved ? "text-brand" : "text-ink/70"} />
          </button>
        ) : null}
      </div>

      <header className="mt-3 px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
          {article.category.name}
        </p>
        <h1 className="mt-1.5 font-display text-[28px] font-bold leading-[1.1] tracking-[-0.01em] text-ink">
          {article.title}
        </h1>
        <p className="mt-2.5 text-[14px] leading-[1.5] text-muted">{article.excerpt}</p>

        <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink/55">
          {article.author.name}
          <span className="h-[2.5px] w-[2.5px] rounded-full bg-ink/30" />
          {timeAgo(article.publishedAt)}
          <span className="h-[2.5px] w-[2.5px] rounded-full bg-ink/30" />
          {article.readingMinutes} min read
        </p>
      </header>

      <div className="mt-4 aspect-[16/10] w-full overflow-hidden bg-media">
        <img
          src={mediaUrl(article.image.src)}
          alt={article.image.alt}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      <div className="mt-5 px-5">
        {article.body.map((block, position) => (
          <Block key={position} block={block} />
        ))}
      </div>
    </article>
  );
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h2 className="mt-6 mb-2 font-display text-[21px] font-bold leading-tight tracking-[-0.01em] text-ink">
          {block.text}
        </h2>
      );
    case "quote":
      return (
        <blockquote className="my-5 border-l-2 border-brand pl-3.5">
          <p className="font-display text-[18px] leading-[1.35] text-ink">{block.text}</p>
          {block.attribution ? (
            <footer className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              {block.attribution}
            </footer>
          ) : null}
        </blockquote>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List className="my-3 list-outside space-y-1.5 pl-5 text-[14px] leading-[1.6] text-ink-soft">
          {block.items.map((item) => (
            <li key={item} className={block.ordered ? "list-decimal" : "list-disc"}>
              {item}
            </li>
          ))}
        </List>
      );
    }
    default:
      return <p className="mt-3 text-[14px] leading-[1.65] text-ink-soft">{block.text}</p>;
  }
}
