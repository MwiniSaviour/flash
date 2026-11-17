/**
 * Fictional demo data for UI prototyping. Names, quotes, events and statistics
 * are invented.
 *
 * The editorial taxonomy mirrors the real Radio Waa newsroom sections
 * (Local News, Politics, Business, Sports, Entertainment, Technology — verified
 * on myradiowaa.com), extended with the desks a full news operation runs.
 *
 * Local extension of `Category` from src/lib/types.ts (which has only
 * id/slug/name/description): accentToken names a colour token from the @theme
 * block in src/app/globals.css (brand | accent | ink | muted); icon names a
 * generated line icon in public/assets/icons/; articleCount is checked by
 * src/data/validate.ts against the real article totals.
 */

import type { Category } from "~/lib/types";

export type CategoryAccentToken = "brand" | "accent" | "ink" | "muted";

export interface EditorialCategory extends Category {
  accentToken: CategoryAccentToken;
  /** Matches public/assets/icons/icon-<icon>.svg */
  icon: string;
  articleCount: number;
}

export const categories: EditorialCategory[] = [
  {
    id: "cat-local-news",
    slug: "local-news",
    name: "Local News",
    description:
      "Reporting from Wa, the districts and the border towns — the stories the national wires miss.",
    accentToken: "brand",
    icon: "map-pin",
    articleCount: 5,
  },
  {
    id: "cat-politics",
    slug: "politics",
    name: "Politics",
    description:
      "Assemblies, campaigns and the region's contests for power, explained without the slogans.",
    accentToken: "ink",
    icon: "gavel",
    articleCount: 3,
  },
  {
    id: "cat-business",
    slug: "business",
    name: "Business",
    description:
      "Shea, groundnut, markets and the small manufacturers trying to keep value in the region.",
    accentToken: "accent",
    icon: "chart",
    articleCount: 3,
  },
  {
    id: "cat-sports",
    slug: "sports",
    name: "Sports",
    description:
      "From floodlit colts football to the regional athletics circuit, with every score read out.",
    accentToken: "brand",
    icon: "trophy",
    articleCount: 2,
  },
  {
    id: "cat-entertainment",
    slug: "entertainment",
    name: "Entertainment",
    description:
      "Dumba, the hip-hop studios behind the market, and the presenters the region argues about.",
    accentToken: "accent",
    icon: "headphones",
    articleCount: 2,
  },
  {
    id: "cat-technology",
    slug: "technology",
    name: "Technology",
    description:
      "Mobile money, transmitters and the engineers keeping 92.1 on air across the region.",
    accentToken: "ink",
    icon: "cpu",
    articleCount: 3,
  },
  {
    id: "cat-health",
    slug: "health",
    name: "Health",
    description:
      "District hospitals, outreach posts and the seasonal health stories that arrive like clockwork.",
    accentToken: "brand",
    icon: "heart",
    articleCount: 2,
  },
  {
    id: "cat-opinion",
    slug: "opinion",
    name: "Opinion",
    description:
      "Columns and analysis from the newsroom and its guests. The writer's view, not the station's.",
    accentToken: "accent",
    icon: "quote",
    articleCount: 1,
  },
  {
    id: "cat-diaspora",
    slug: "diaspora",
    name: "Diaspora",
    description:
      "The region abroad: remittances, hometown associations and the people funding the next ward.",
    accentToken: "ink",
    icon: "globe",
    articleCount: 1,
  },
  {
    id: "cat-weather-traffic",
    slug: "weather-traffic",
    name: "Weather & Traffic",
    description:
      "Harmattan visibility, road closures and the morning drive, updated hourly.",
    accentToken: "brand",
    icon: "cloud-sun",
    articleCount: 1,
  },
];

export function getCategoryBySlug(slug: string): EditorialCategory | undefined {
  return categories.find((category) => category.slug === slug);
}

export function getCategoryById(id: string): EditorialCategory | undefined {
  return categories.find((category) => category.id === id);
}
