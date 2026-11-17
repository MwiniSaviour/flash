import type { Article } from "~/lib/types";
import { articles } from "~/data/articles";

/**
 * The newsroom view of the shared article fixtures. Everything is derived from
 * `src/data/articles.ts` — same stories, same images, same bylines as the web.
 */

const byNewest = (a: Article, b: Article) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

/** Editor's picks first, then the most recent. */
const byProminence = (a: Article, b: Article) =>
  Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || byNewest(a, b);

/**
 * Split a desk's stories into the carousel and the list that follows it.
 *
 * Featured stories lead the carousel, everything else falls back to newest
 * first, so filtering by desk keeps the same rhythm as the unfiltered page.
 */
export function selectStories(desk: string | null): {
  breaking: Article[];
  leads: Article[];
  latest: Article[];
} {
  const pool = storiesIn(desk).slice().sort(byProminence);
  return {
    breaking: pool.filter((article) => article.breaking),
    leads: pool.slice(0, 10),
    latest: pool.slice(10),
  };
}

/** Every desk from the shared taxonomy, with how many stories it holds. */
export const newsCategories = (() => {
  const counts = new Map<string, { name: string; count: number }>();
  for (const article of articles) {
    const { slug, name } = article.category;
    const entry = counts.get(slug) ?? { name, count: 0 };
    entry.count += 1;
    counts.set(slug, entry);
  }
  return [...counts.entries()]
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
})();

/** Stories from one desk, or every story when no desk is chosen. */
export function storiesIn(slug: string | null): Article[] {
  return slug ? articles.filter((article) => article.category.slug === slug) : articles;
}

/** One story by slug, for the reader screen. */
export function findArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}
