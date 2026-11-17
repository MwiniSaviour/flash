/**
 * Fictional demo data for UI prototyping — the ticketed events in the Prototype
 * Radio mock. Venues are real Upper West landmarks (Labadi Beach, Alliance
 * Française, the Trade Fair Centre) but every event, line-up and price here is
 * invented; nothing is on sale. Event artwork is generated (see
 * docs/assets-provenance.md).
 *
 * The dates keep the mock's weekday labels (SAT 26 APR … SAT 10 MAY), so the
 * design's date badges render exactly as drawn. They are demo fixtures, not a
 * live listings feed.
 */

import type { EventItem, Ticket, ListenerProfile } from "~/lib/types";

export const events: EventItem[] = [
  {
    id: "event-sunset-live-sessions",
    slug: "sunset-live-sessions",
    title: "Sunset Live Sessions",
    subtitle: "Music • Food • Good Vibes",
    description:
      "The Sunset Live Sessions brings together great music, local talent, food and a vibrant crowd at Labadi Beach. Experience the best of Wa's music scene in a stunning coastal setting.",
    venue: "Labadi Beach",
    city: "Wa",
    distanceKm: 6.2,
    date: "2025-04-26",
    startTime: "18:00",
    endTime: "22:00",
    image: {
      src: "/assets/images/event-sunset-live.jpg",
      alt: "A crowd with hands raised in front of a lit stage",
    },
    tags: ["Music", "Festival"],
    featured: true,
    priceFrom: 120,
    tiers: [
      {
        id: "tier-sunset-ga",
        name: "General Admission",
        description: "Access to the event area",
        price: 120,
        perks: ["Standing access", "Food village"],
        icon: "ticket",
      },
      {
        id: "tier-sunset-vip",
        name: "VIP Experience",
        description: "Front row area • Premium bar • Lounge access",
        price: 250,
        perks: ["Front row area", "Premium bar", "Lounge access"],
        icon: "crown",
      },
    ],
    amenities: [
      { label: "Live Music", icon: "music" },
      { label: "Food & Drinks", icon: "drink" },
      { label: "Good Vibes", icon: "heart" },
    ],
  },
  {
    id: "event-highlife-legends-night",
    slug: "highlife-legends-night",
    title: "Highlife Legends Night",
    subtitle: "Live band • Throwback night",
    description:
      "A seated evening with a twelve-piece highlife band working through the golden catalogue, recorded for later broadcast on Prototype FM.",
    venue: "National Theatre",
    city: "Wa",
    distanceKm: 9.4,
    date: "2025-02-15",
    startTime: "19:00",
    endTime: "23:00",
    image: {
      src: "/assets/images/event-highlife-night.jpg",
      alt: "A live band playing under stage lights",
    },
    tags: ["Music", "Live Show"],
    priceFrom: 90,
    tiers: [
      {
        id: "tier-highlife-ga",
        name: "General Admission",
        description: "Balcony seating",
        price: 90,
        perks: ["Balcony seating"],
        icon: "ticket",
      },
    ],
    amenities: [
      { label: "Live Band", icon: "music" },
      { label: "Bar", icon: "drink" },
    ],
  },
  {
    id: "event-wa-comedy-night",
    slug: "wa-comedy-night",
    title: "Wa Comedy Night",
    subtitle: "Stand-up • New material • Late bar",
    description:
      "A monthly stand-up night in the Alliance Française garden: four comics, one host and a lot of new material being tested on a friendly room.",
    venue: "Alliance Française",
    city: "Wa",
    distanceKm: 6.2,
    date: "2025-04-27",
    startTime: "19:30",
    endTime: "22:00",
    image: {
      src: "/assets/images/event-comedy-night.jpg",
      alt: "A comedian at the microphone under a warm spotlight",
    },
    tags: ["Comedy", "Live Show"],
    priceFrom: 180,
    tiers: [
      {
        id: "tier-comedy-ga",
        name: "General Admission",
        description: "Garden seating • First come, first served",
        price: 180,
        perks: ["Garden seating", "Late bar"],
        icon: "ticket",
      },
      {
        id: "tier-comedy-vip",
        name: "VIP Experience",
        description: "Front table • Welcome drink • Meet the comics",
        price: 320,
        perks: ["Front table", "Welcome drink", "Meet the comics"],
        icon: "crown",
      },
    ],
    amenities: [
      { label: "Live Comedy", icon: "music" },
      { label: "Bar", icon: "drink" },
      { label: "Good Vibes", icon: "heart" },
    ],
  },
  {
    id: "event-afrobeats-zone",
    slug: "afrobeats-zone",
    title: "AfroBeats Zone",
    subtitle: "Afrobeats • Amapiano • All night",
    description:
      "The beachfront turns into a dance floor: resident DJs, a live percussion set and Afrobeats until the tide comes in.",
    venue: "Labadi Beach",
    city: "Wa",
    distanceKm: 7.1,
    date: "2025-05-02",
    startTime: "20:00",
    endTime: "02:00",
    image: {
      src: "/assets/images/event-afrobeats-zone.jpg",
      alt: "A crowd dancing under purple club lights",
    },
    tags: ["Music", "Party"],
    priceFrom: 100,
    tiers: [
      {
        id: "tier-afrobeats-ga",
        name: "General Admission",
        description: "Access to the beach stage",
        price: 100,
        perks: ["Beach stage", "Street food"],
        icon: "ticket",
      },
      {
        id: "tier-afrobeats-vip",
        name: "VIP Experience",
        description: "Raised deck • Bottle service • Fast entry",
        price: 220,
        perks: ["Raised deck", "Bottle service", "Fast entry"],
        icon: "crown",
      },
    ],
    amenities: [
      { label: "Live DJs", icon: "music" },
      { label: "Drinks", icon: "drink" },
      { label: "Good Vibes", icon: "heart" },
    ],
  },
  {
    id: "event-urban-vibes-festival",
    slug: "urban-vibes-festival",
    title: "Urban Vibes Festival",
    subtitle: "Two stages • Food market • Design fair",
    description:
      "A full-day city festival at the Trade Fair Centre: two stages of urban music, a food market from markets across the Upper West Region and a design fair for independent makers.",
    venue: "Trade Fair Centre",
    city: "Wa",
    distanceKm: 12.4,
    date: "2025-05-10",
    startTime: "12:00",
    endTime: "23:00",
    image: {
      src: "/assets/images/event-urban-vibes.jpg",
      alt: "Festival-goers in front of an illuminated main stage",
    },
    tags: ["Music", "Festival", "Food & Drink"],
    priceFrom: 150,
    tiers: [
      {
        id: "tier-urban-ga",
        name: "General Admission",
        description: "Both stages • Food market",
        price: 150,
        perks: ["Both stages", "Food market"],
        icon: "ticket",
      },
      {
        id: "tier-urban-vip",
        name: "VIP Experience",
        description: "Stage-side deck • Lounge • Fast entry",
        price: 300,
        perks: ["Stage-side deck", "Lounge", "Fast entry"],
        icon: "crown",
      },
    ],
    amenities: [
      { label: "Two Stages", icon: "music" },
      { label: "Food Market", icon: "drink" },
      { label: "Design Fair", icon: "star" },
    ],
  },
];

/**
 * The signed-in demo listener. The app has no auth flow in this design, so this
 * document stands in for the account and the wallet below is its ticket list.
 */
export const listener: ListenerProfile = {
  id: "listener-saviour-mwini",
  name: "Saviour Mwini",
  email: "saviour@pulse.com",
  avatarUrl: "/assets/images/avatar-saviour.jpg",
  favouriteStationIds: ["station-prototype-fm"],
  notificationsEnabled: true,
};

export const tickets: Ticket[] = [
  {
    id: "ticket-sunset-live",
    eventId: "event-sunset-live-sessions",
    tierId: "tier-sunset-ga",
    tierName: "General Admission",
    quantity: 2,
    status: "confirmed",
    reference: "PLS-4261-8820",
  },
  {
    id: "ticket-comedy-night",
    eventId: "event-wa-comedy-night",
    tierId: "tier-comedy-vip",
    tierName: "VIP Experience",
    quantity: 2,
    status: "confirmed",
    reference: "PLS-4271-9014",
  },
  {
    id: "ticket-afrobeats-zone",
    eventId: "event-afrobeats-zone",
    tierId: "tier-afrobeats-ga",
    tierName: "General Admission",
    quantity: 4,
    status: "confirmed",
    reference: "PLS-5021-3378",
  },
  {
    id: "ticket-urban-vibes",
    eventId: "event-urban-vibes-festival",
    tierId: "tier-urban-vip",
    tierName: "VIP Experience",
    quantity: 2,
    status: "pending",
    reference: "PLS-5101-6602",
  },
  // A finished order so the wallet's Past tab has content and the profile
  // counts (12 tickets across 5 events) add up like the design's.
  {
    id: "ticket-highlife-legends",
    eventId: "event-highlife-legends-night",
    tierId: "tier-highlife-ga",
    tierName: "General Admission",
    quantity: 2,
    status: "past",
    reference: "PLS-2151-4407",
  },
];

const eventsById = new Map(events.map((event) => [event.id, event]));

export function getEventById(id: string): EventItem | undefined {
  return eventsById.get(id);
}

export function getEventBySlug(slug: string): EventItem | undefined {
  return events.find((event) => event.slug === slug);
}

/** Distinct event count in the wallet — the Profile tab's "Events" stat. */
export const walletEventIds = [...new Set(tickets.map((ticket) => ticket.eventId))];

/** Ticket units in the wallet — the Profile tab's "Tickets" stat. */
export const walletTicketCount = tickets.reduce((total, ticket) => total + ticket.quantity, 0);
