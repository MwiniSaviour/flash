/**
 * Fictional demo data for UI prototyping. Names, quotes, events and statistics
 * are invented. "Radio Waa" is a real broadcaster (92.1 FM, Wa, Upper West
 * Region, Ghana — see docs/mock-data-report.md); the people below are NOT real
 * Radio Waa staff and must not be presented as such.
 *
 * Local extension of `Author` from src/lib/types.ts: the shared type has no
 * slug/bio/socials fields, so they are added here rather than editing that file.
 */

import type { Author } from "~/lib/types";

export interface AuthorProfile extends Author {
  slug: string;
  /** Two or three credible sentences, newsroom-bio style. */
  bio: string;
  location: string;
  /** Desk specialisms, used for bylines and tag pages. */
  specialisms: string[];
  social: { label: string; href: string }[];
}

export const authors: AuthorProfile[] = [
  {
    id: "author-nana-yaa",
    slug: "nana-yaa",
    name: "Nana Yaa",
    role: "Afrobeats presenter",
    avatarUrl: "/assets/images/avatar-nana-yaa.jpg",
    bio: "Presents the Afrobeats strand and books the guest mixes. Started on campus radio in Legon, spent three years on the club circuit running sound, and now spends the small hours putting together a show that moves from highlife to amapiano without losing the thread.",
    location: "Wa",
    specialisms: ["afrobeats", "amapiano", "club culture"],
    social: [
      { label: "X", href: "https://x.com/" },
      { label: "Instagram", href: "https://instagram.com/" },
    ],
  },
  {
    id: "author-abu-sule",
    slug: "abu-bakari-sule",
    name: "Abu Bakari Sule",
    role: "Newsroom editor",
    avatarUrl: "/assets/images/avatar-abu-bakari-sule.jpg",
    bio: "Joined the newsroom as a district stringer in Wa West and now runs it. Spent six years covering the shea belt before moving to the desk, and still files the big local investigations himself. Teaches a weekend reporting clinic at the Wa press club.",
    location: "Wa",
    specialisms: ["local news", "investigations", "water & utilities"],
    social: [
      { label: "X", href: "https://x.com/" },
      { label: "Facebook", href: "https://facebook.com/" },
    ],
  },
  {
    id: "author-hawa-musah",
    slug: "hawa-musah",
    name: "Hawa Musah",
    role: "Senior political reporter",
    avatarUrl: "/assets/images/avatar-hawa-musah.jpg",
    bio: "Covers the Upper West political beat, from regional executive meetings to constituency disputes. Known for reading manifestos so listeners do not have to, and for the annual pre-election road audit she compiles from assembly records.",
    location: "Wa",
    specialisms: ["politics", "elections", "accountability"],
    social: [
      { label: "X", href: "https://x.com/" },
      { label: "Facebook", href: "https://facebook.com/" },
    ],
  },
  {
    id: "author-david-kuunyoo",
    slug: "david-kuunyoo",
    name: "David Kuunyoo",
    role: "Business & markets correspondent",
    avatarUrl: "/assets/images/avatar-david-kuunyoo.jpg",
    bio: "Reports on groundnut, shea and the small manufacturers trying to process both in-region. Started out on the market desk reading prices over the phone every morning, and still does the Friday prices round-up by hand.",
    location: "Wa",
    specialisms: ["business", "agriculture", "trade"],
    social: [{ label: "X", href: "https://x.com/" }],
  },
  {
    id: "author-fatima-nyagse",
    slug: "fatima-ba-nyagse",
    name: "Fatima Ba-Nyagse",
    role: "Health reporter",
    avatarUrl: "/assets/images/avatar-fatima-ba-nyagse.jpg",
    bio: "Reports from district hospitals and immunization outreach posts, mostly during the rainy season and the weeks after it. Trained as a community health nurse before retraining as a journalist, and asks the questions the clinic did not.",
    location: "Jirapa",
    specialisms: ["health", "sanitation", "harmattan desk"],
    social: [{ label: "X", href: "https://x.com/" }],
  },
  {
    id: "author-ibrahim-tampuole",
    slug: "ibrahim-tampuole",
    name: "Ibrahim Tampuole",
    role: "Sports reporter",
    avatarUrl: "/assets/images/avatar-ibrahim-tampuole.jpg",
    bio: "Commentates from touchlines across the region, from the SDD University league to Sunday colts football. Keeps the region's most complete set of fixtures in a battered notebook, and reads the full-time scores on Full Time every Saturday.",
    location: "Wa",
    specialisms: ["football", "athletics", "grassroots sport"],
    social: [{ label: "X", href: "https://x.com/" }],
  },
  {
    id: "author-grace-adengaa",
    slug: "grace-adengaa",
    name: "Grace Adengaa",
    role: "Entertainment & culture",
    avatarUrl: "/assets/images/avatar-grace-adengaa.jpg",
    bio: "Hosts the afternoon and drive shows, and reviews what the region actually listens to. A DJ before she was a presenter; still plays four records a shift and will argue about hiplife versus the new Wa hip-hop scene at length.",
    location: "Wa",
    specialisms: ["music", "festivals", "youth culture"],
    social: [
      { label: "Instagram", href: "https://instagram.com/" },
      { label: "TikTok", href: "https://tiktok.com/" },
    ],
  },
  {
    id: "author-solomon-geyidonyah",
    slug: "solomon-geyidonyah",
    name: "Solomon Geyidonyah",
    role: "Technology correspondent",
    avatarUrl: "/assets/images/avatar-solomon-geyidonyah.jpg",
    bio: "Covers mobile money, rural connectivity and the students wiring sensors onto shea trees. Files the Monday tech segment on Good Morning Wa and answers listener gadgets questions on the request line.",
    location: "Wa",
    specialisms: ["technology", "connectivity", "mobile money"],
    social: [{ label: "X", href: "https://x.com/" }],
  },
  {
    id: "author-comfort-nangmin",
    slug: "comfort-nangmin",
    name: "Comfort Nangmin",
    role: "Community & diaspora reporter",
    avatarUrl: "/assets/images/avatar-comfort-nangmin.jpg",
    bio: "Reports on the associations, endowment funds and hometown projects that quietly hold the region together, including the remittances that finance them. Presents Community Matters and reads the Open Line dedications on Sundays.",
    location: "Lawra",
    specialisms: ["community", "diaspora", "education"],
    social: [{ label: "X", href: "https://x.com/" }],
  },
];

export function getAuthorById(id: string): AuthorProfile | undefined {
  return authors.find((author) => author.id === id);
}

export function getAuthorBySlug(slug: string): AuthorProfile | undefined {
  return authors.find((author) => author.slug === slug);
}
