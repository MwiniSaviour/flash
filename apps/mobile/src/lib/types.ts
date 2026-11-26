/** ISO-8601 timestamp string, e.g. "2026-10-14T06:30:00.000Z". */
export type IsoDate = string;

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface Author {
  id: string;
  name: string;
  role: string;
  /** Optional portrait URL; without it the Avatar falls back to initials. */
  avatarUrl?: string;
}

export interface ImageAsset {
  src: string;
  /** Descriptive alt text — required, never empty. */
  alt: string;
  credit?: string;
}

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "list"; ordered?: boolean; items: string[] };

export interface Article {
  id: string;
  slug: string;
  title: string;
  /** Standfirst / deck shown under the headline. */
  excerpt: string;
  category: Category;
  author: Author;
  publishedAt: IsoDate;
  updatedAt?: IsoDate;
  readingMinutes: number;
  image: ImageAsset;
  tags: string[];
  featured?: boolean;
  breaking?: boolean;
  body: ArticleBlock[];
}

export interface ShowSlot {
  day: Weekday;
  /** 24h local time, "HH:MM". */
  start: string;
  end: string;
}

export interface Show {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  hosts: Author[];
  schedule: ShowSlot[];
  image: ImageAsset;
  category?: Category;
}

export interface PodcastEpisode {
  id: string;
  slug: string;
  title: string;
  description: string;
  showId: string;
  season: number;
  episodeNumber: number;
  publishedAt: IsoDate;
  durationSeconds: number;
  image: ImageAsset;
  tags: string[];
}

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface SocialLink {
  label: string;
  href: string;
}

/**
 * ScalDive (mobile) domain types.
 *
 * The Capacitor app in apps/mobile reads these through the same content layer
 * the website uses, so the CMS stays the single source of truth for the seeded
 * stations, events and ticket wallet.
 */

export interface Station {
  id: string;
  slug: string;
  name: string;
  /** Dial position as displayed, e.g. "102.5 FM". */
  frequency: string;
  city: string;
  tagline: string;
  artwork: ImageAsset;
  /** Live stream URL; empty string renders the "not configured" player state. */
  streamUrl: string;
  /** True for the station the app boots into (Prototype FM). */
  flagship?: boolean;
  live?: boolean;
}

export type EventTag =
  | "Music"
  | "Comedy"
  | "Food & Drink"
  | "Community"
  | "Festival"
  | "Party"
  | "Live Show";

export interface TicketTier {
  id: string;
  name: string;
  description: string;
  /** Whole cedis; the UI formats with a "GHC" prefix. */
  price: number;
  /** Perks listed on the event page. */
  perks: string[];
  /** Lucide-style icon stem rendered by the app's icon set. */
  icon: "ticket" | "crown";
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  venue: string;
  city: string;
  distanceKm: number;
  /** Local start/end times, "HH:MM". */
  startTime: string;
  endTime: string;
  /** Event date, ISO (yyyy-mm-dd). The seed keeps the design's Apr/May weekends. */
  date: IsoDate;
  image: ImageAsset;
  tags: EventTag[];
  featured?: boolean;
  priceFrom: number;
  tiers: TicketTier[];
  amenities: { label: string; icon: "music" | "drink" | "heart" | "star" }[];
}

export type TicketStatus = "confirmed" | "pending" | "past";

export interface Ticket {
  id: string;
  eventId: string;
  tierId: string;
  tierName: string;
  quantity: number;
  status: TicketStatus;
  /** Order reference shown on the ticket detail sheet. */
  reference: string;
}

export interface ListenerProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  favouriteStationIds: string[];
  notificationsEnabled: boolean;
}

export interface WalletSummary {
  tickets: number;
  events: number;
  stations: number;
}
