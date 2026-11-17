/**
 * Fictional demo data for UI prototyping. Show names, presenters, schedules and
 * descriptions are invented. "Radio Waa" is a real broadcaster (92.1 FM, Wa,
 * Upper West Region, Ghana — see docs/mock-data-report.md); none of the people
 * below are real Radio Waa staff and the schedule below is NOT the station's
 * real schedule. Cover art is generated placeholder art (see
 * docs/assets-provenance.md).
 *
 * One programme name is borrowed from public research: listener reviews of the
 * real station mention a "Legal Aid" phone-in (africabz.com listing, reviews
 * dated 2019–2020). Everything else here is invented.
 *
 * Every host id and category slug is resolved through the guards below, so a
 * typo fails at module load instead of silently rendering an empty byline.
 */

import type { Author, Category, Show, Weekday } from "~/lib/types";
import { authors, type AuthorProfile } from "./authors";
import { categories, type EditorialCategory } from "./categories";

const authorsById = new Map<string, AuthorProfile>(authors.map((author) => [author.id, author]));

/** Resolve an author id to the real author record, or fail loudly. */
function host(id: string): Author {
  const found = authorsById.get(id);
  if (!found) throw new Error(`shows.ts: unknown author id "${id}"`);
  return found;
}

const categoriesBySlug = new Map<string, EditorialCategory>(
  categories.map((category) => [category.slug, category]),
);

/** Resolve a category slug to the real category record, or fail loudly. */
function desk(slug: string): Category {
  const found = categoriesBySlug.get(slug);
  if (!found) throw new Error(`shows.ts: unknown category slug "${slug}"`);
  return found;
}

export const shows: Show[] = [
  {
    id: "show-good-morning-wa",
    slug: "good-morning-wa",
    name: "Good Morning Wa",
    tagline: "The day's reporting, read properly, before the traffic gets bad.",
    description:
      "The weekday breakfast show and the station's biggest window on the region. The newsroom editor and the technology correspondent work through the overnight stories, the district reports and the court list, with the Monday tech segment and a weather and road check before the eight o'clock headlines.",
    hosts: [host("author-abu-sule"), host("author-solomon-geyidonyah")],
    schedule: [
      { day: "monday", start: "05:30", end: "09:00" },
      { day: "tuesday", start: "05:30", end: "09:00" },
      { day: "wednesday", start: "05:30", end: "09:00" },
      { day: "thursday", start: "05:30", end: "09:00" },
      { day: "friday", start: "05:30", end: "09:00" },
    ],
    image: {
      src: "/assets/images/show-good-morning-wa.jpg",
      alt: "A presenter in headphones speaking into a studio microphone",
    },
    category: desk("local-news"),
  },
  {
    id: "show-the-wa-report",
    slug: "the-wa-report",
    name: "The Wa Report",
    tagline: "One region, explained before lunch.",
    description:
      "The mid-morning current-affairs magazine. Assembly agendas, regional coordinating council decisions and the week's documents, read line by line with the people who wrote them, plus a standing health-desk segment on district hospitals and the seasonal calendar.",
    hosts: [host("author-hawa-musah"), host("author-fatima-nyagse")],
    schedule: [
      { day: "monday", start: "09:00", end: "10:00" },
      { day: "tuesday", start: "09:00", end: "10:00" },
      { day: "wednesday", start: "09:00", end: "10:00" },
      { day: "thursday", start: "09:00", end: "10:00" },
      { day: "friday", start: "09:00", end: "10:00" },
    ],
    image: {
      src: "/assets/images/show-the-wa-report.jpg",
      alt: "A presenter at the microphone during a live programme",
    },
    category: desk("politics"),
  },
  {
    id: "show-market-square",
    slug: "market-square",
    name: "Market Square",
    tagline: "Prices, traders and the road the produce takes.",
    description:
      "The late-morning business show. Groundnut and shea prices read out market by market, the state of the district roads the trucks depend on, and an interview with someone who has just tried to process a raw commodity inside the region.",
    hosts: [host("author-david-kuunyoo")],
    schedule: [
      { day: "monday", start: "10:00", end: "12:00" },
      { day: "tuesday", start: "10:00", end: "12:00" },
      { day: "wednesday", start: "10:00", end: "12:00" },
      { day: "thursday", start: "10:00", end: "12:00" },
      { day: "friday", start: "10:00", end: "12:00" },
    ],
    image: {
      src: "/assets/images/show-market-square.jpg",
      alt: "Pineapples piled high on a market stall",
    },
    category: desk("business"),
  },
  {
    id: "show-news-at-noon",
    slug: "news-at-noon",
    name: "News at Noon",
    tagline: "The whole bulletin, in half an hour, every day.",
    description:
      "The daily news bulletin, read by the newsroom editor. Local and national copy, the regional weather, and the traffic and road closures that matter before the afternoon heat.",
    hosts: [host("author-abu-sule")],
    schedule: [
      { day: "monday", start: "12:00", end: "12:30" },
      { day: "tuesday", start: "12:00", end: "12:30" },
      { day: "wednesday", start: "12:00", end: "12:30" },
      { day: "thursday", start: "12:00", end: "12:30" },
      { day: "friday", start: "12:00", end: "12:30" },
      { day: "saturday", start: "12:00", end: "12:30" },
      { day: "sunday", start: "12:00", end: "12:30" },
    ],
    image: {
      src: "/assets/images/show-news-at-noon.jpg",
      alt: "A broadcast mixing console in the studio",
    },
    category: desk("local-news"),
  },
  {
    id: "show-legal-aid",
    slug: "legal-aid",
    name: "Legal Aid",
    tagline: "Your rights, in the language you asked in.",
    description:
      "The weekday phone-in on rights, police procedure, land and tenancy. Callers describe a problem, a lawyer answers what the law actually says, and the station keeps a written summary of the advice so nobody has to rely on memory. The real station runs a programme of this name; this is a fictional version of it.",
    hosts: [host("author-hawa-musah")],
    schedule: [
      { day: "monday", start: "12:30", end: "13:30" },
      { day: "tuesday", start: "12:30", end: "13:30" },
      { day: "wednesday", start: "12:30", end: "13:30" },
      { day: "thursday", start: "12:30", end: "13:30" },
      { day: "friday", start: "12:30", end: "13:30" },
    ],
    image: {
      src: "/assets/images/show-legal-aid.jpg",
      alt: "A judge's gavel resting on a stack of law books",
    },
    category: desk("politics"),
  },
  {
    id: "show-afternoon-mix",
    slug: "the-afternoon-mix",
    name: "The Afternoon Mix",
    tagline: "Records, requests and the news at four.",
    description:
      "The weekday afternoon show. Four records an hour from the region's own catalogue, listener requests read out in full, and a short news and sport round-up on the hour.",
    hosts: [host("author-grace-adengaa")],
    schedule: [
      { day: "monday", start: "13:30", end: "16:00" },
      { day: "tuesday", start: "13:30", end: "16:00" },
      { day: "wednesday", start: "13:30", end: "16:00" },
      { day: "thursday", start: "13:30", end: "16:00" },
      { day: "friday", start: "13:30", end: "16:00" },
    ],
    image: {
      src: "/assets/images/show-afternoon-mix.jpg",
      alt: "A hand cueing a record on a turntable",
    },
    category: desk("entertainment"),
  },
  {
    id: "show-dryve-92-1",
    slug: "dryve-92-1",
    name: "Dryve 92.1",
    tagline: "Culture, conversation and the long way home.",
    description:
      "The drive show across the evening peak. Conversations that run past their slot, the afternoon's sport results read in full, a road and harmattan check for anyone still on the Wa–Tumu or Wa–Nandom road, and the playlist nobody in the building will admit to choosing.",
    hosts: [host("author-grace-adengaa"), host("author-ibrahim-tampuole")],
    schedule: [
      { day: "monday", start: "16:00", end: "18:30" },
      { day: "tuesday", start: "16:00", end: "18:30" },
      { day: "wednesday", start: "16:00", end: "18:30" },
      { day: "thursday", start: "16:00", end: "18:30" },
      { day: "friday", start: "16:00", end: "18:30" },
    ],
    image: {
      src: "/assets/images/show-dryve-92-1.jpg",
      alt: "A presenter talking into a microphone in a warm-lit studio",
    },
    category: desk("entertainment"),
  },
  {
    id: "show-evening-bulletin",
    slug: "evening-bulletin",
    name: "Evening Bulletin",
    tagline: "Everything that moved today, in fifteen minutes.",
    description:
      "The evening news summary. The day's local and national stories, tomorrow's diary items, and the overnight weather for the districts.",
    hosts: [host("author-abu-sule")],
    schedule: [
      { day: "monday", start: "18:30", end: "19:00" },
      { day: "tuesday", start: "18:30", end: "19:00" },
      { day: "wednesday", start: "18:30", end: "19:00" },
      { day: "thursday", start: "18:30", end: "19:00" },
      { day: "friday", start: "18:30", end: "19:00" },
    ],
    image: {
      src: "/assets/images/show-evening-bulletin.jpg",
      alt: "A hand riding the faders on a studio desk",
    },
    category: desk("local-news"),
  },
  {
    id: "show-community-matters",
    slug: "community-matters",
    name: "Community Matters",
    tagline: "The associations, funds and projects holding the region together.",
    description:
      "The weekday evening community hour. Hometown associations, endowment funds, diaspora-funded wards and clinics, and the people quietly doing the work the budget line does not cover.",
    hosts: [host("author-comfort-nangmin")],
    schedule: [
      { day: "monday", start: "19:00", end: "20:00" },
      { day: "tuesday", start: "19:00", end: "20:00" },
      { day: "wednesday", start: "19:00", end: "20:00" },
      { day: "thursday", start: "19:00", end: "20:00" },
      { day: "friday", start: "19:00", end: "20:00" },
    ],
    image: {
      src: "/assets/images/show-community-matters.jpg",
      alt: "A presenter speaking into a microphone in a bright studio",
    },
    category: desk("local-news"),
  },
  {
    id: "show-hottest-mic",
    slug: "hottest-mic",
    name: "Hottest Mic",
    tagline: "Friday nights, played loud and explained properly.",
    description:
      "The Friday night music show. New records from the region's studios, a guest who defends one track they have no business defending, and a live set from whoever is in town.",
    hosts: [host("author-grace-adengaa")],
    schedule: [{ day: "friday", start: "21:00", end: "23:00" }],
    image: {
      src: "/assets/images/show-hottest-mic.jpg",
      alt: "Two performers on a small club stage",
    },
    category: desk("entertainment"),
  },
  {
    id: "show-afrobeats-takeover",
    slug: "afrobeats-takeover",
    name: "Afrobeats Takeover",
    tagline: "The records that filled the clubs, played back at you.",
    description:
      "Ten hours of west African dance music, from the current Afrobeats chart back to the highlife records it grew out of. Guest selectors drop in around the middle of the night, and the last two hours belong to whatever the request line has been quietly collecting all week.",
    hosts: [host("author-nana-yaa")],
    schedule: [{ day: "friday", start: "03:00", end: "13:00" }],
    image: {
      src: "/assets/images/show-afrobeats-takeover.jpg",
      alt: "A crowd dancing under club lights",
    },
    category: desk("entertainment"),
  },
  {
    id: "show-night-frequency",
    slug: "the-night-frequency",
    name: "The Night Frequency",
    tagline: "Requests, sleep-talk and the headlines on the hour.",
    description:
      "The overnight strand. A request-led music sequence, the hourly news summary, a road and weather check for anyone travelling through the night, and the dedication that somebody needs read out before morning.",
    hosts: [host("author-comfort-nangmin")],
    schedule: [
      { day: "monday", start: "00:00", end: "06:00" },
      { day: "tuesday", start: "00:00", end: "06:00" },
      { day: "wednesday", start: "00:00", end: "06:00" },
      { day: "thursday", start: "00:00", end: "06:00" },
      { day: "friday", start: "00:00", end: "06:00" },
      { day: "saturday", start: "00:00", end: "06:00" },
      { day: "sunday", start: "00:00", end: "06:00" },
    ],
    image: {
      src: "/assets/images/show-night-frequency.jpg",
      alt: "A studio microphone lit against a dark backdrop",
    },
    category: desk("entertainment"),
  },
  {
    id: "show-full-time",
    slug: "full-time",
    name: "Full Time",
    tagline: "Every grassroots result, read out with real sincerity.",
    description:
      "Weekend sport from the top of the pyramid to the bottom of the Sunday league. Full-time scores, the district colts fixtures, the athletics circuit, and reports from the touchlines.",
    hosts: [host("author-ibrahim-tampuole")],
    schedule: [
      { day: "saturday", start: "14:00", end: "17:00" },
      { day: "sunday", start: "14:00", end: "17:00" },
    ],
    image: {
      src: "/assets/images/show-full-time.jpg",
      alt: "A floodlit football pitch at night",
    },
    category: desk("sports"),
  },
  {
    id: "show-waa-music-countdown",
    slug: "waa-music-countdown",
    name: "Waa Music Countdown",
    tagline: "The region's own chart, compiled from requests.",
    description:
      "Saturday evening's countdown of the records the region actually asked for, counted from the request line and the station's message board rather than from any national chart.",
    hosts: [host("author-grace-adengaa")],
    schedule: [{ day: "saturday", start: "19:00", end: "21:00" }],
    image: {
      src: "/assets/images/show-waa-music-countdown.jpg",
      alt: "A record turning on a turntable under red light",
    },
    category: desk("entertainment"),
  },
  {
    id: "show-the-long-listen",
    slug: "the-long-listen",
    name: "The Long Listen",
    tagline: "One story, told once, without a jingle.",
    description:
      "The Sunday documentary strand: one subject, one long morning, and as much time as the story actually needs. Produced in-house, with the reporter who filed the original story doing the narration.",
    hosts: [host("author-abu-sule")],
    schedule: [{ day: "sunday", start: "10:00", end: "12:00" }],
    image: {
      src: "/assets/images/show-the-long-listen.jpg",
      alt: "Two producers talking across a studio desk",
    },
    category: desk("local-news"),
  },
  {
    id: "show-open-line",
    slug: "open-line",
    name: "Open Line",
    tagline: "The call-in that never quite ends.",
    description:
      "The Sunday evening community hour: requests, arguments, the lost-and-found that actually works, and the harmattan forecast for the week ahead.",
    hosts: [host("author-comfort-nangmin")],
    schedule: [{ day: "sunday", start: "19:00", end: "21:00" }],
    image: {
      src: "/assets/images/show-open-line.jpg",
      alt: "A presenter laughing at the microphone",
    },
    category: desk("local-news"),
  },
  {
    id: "show-weekend-wake-up",
    slug: "weekend-wake-up",
    name: "Weekend Wake-Up",
    tagline: "Weekend breakfast, before the first buses leave.",
    description:
      "The weekend breakfast strand. The overnight headlines, the harmattan and road check for anyone travelling to Wa or heading out to the districts, the weekend's ceremonies, fixtures and market days read out in full, and the messages left on the request line overnight, with the towns they came from.",
    hosts: [host("author-hawa-musah"), host("author-fatima-nyagse")],
    schedule: [
      { day: "saturday", start: "06:00", end: "10:00" },
      { day: "sunday", start: "06:00", end: "10:00" },
    ],
    image: {
      src: "/assets/images/show-weekend-wake-up.jpg",
      alt: "A presenter in headphones at a studio microphone",
    },
    category: desk("local-news"),
  },
  {
    id: "show-weekend-mix",
    slug: "weekend-mix",
    name: "Weekend Mix",
    tagline: "Records played the long way round.",
    description:
      "Saturday's late-morning music block. Longer sequences than the weekday shows allow — highlife, hiplife and the Wa hip-hop records the countdown runs out of time for — played end to end, with the story of one of them each hour.",
    hosts: [host("author-grace-adengaa")],
    schedule: [{ day: "saturday", start: "10:00", end: "12:00" }],
    image: {
      src: "/assets/images/show-weekend-mix.jpg",
      alt: "A keyboard and monitors in a production room",
    },
    category: desk("entertainment"),
  },
  {
    id: "show-weekend-table",
    slug: "weekend-table",
    name: "Weekend Table",
    tagline: "What the region is eating, and what it paid for it.",
    description:
      "The weekend food, market and community show. What is in season and what it costs — groundnut, shea, maize and the tomato trucks from the south. Saturdays go to the market; Sundays to the community kitchens, funerals and festivals feeding the district.",
    hosts: [host("author-comfort-nangmin"), host("author-david-kuunyoo")],
    schedule: [
      { day: "saturday", start: "12:30", end: "14:00" },
      { day: "sunday", start: "12:30", end: "14:00" },
    ],
    image: {
      src: "/assets/images/show-weekend-table.jpg",
      alt: "A bowl of groundnut soup served at a roadside kitchen",
    },
    category: desk("business"),
  },
  {
    id: "show-weekend-sundown",
    slug: "weekend-sundown",
    name: "Weekend Sundown",
    tagline: "The last of the afternoon, played slowly.",
    description:
      "The weekend wind-down. Slow records and dedications, the day's results read once more for anyone just back from the pitch, and the harmattan forecast for the evening. Hands over to the countdown on Saturdays and Open Line on Sundays.",
    hosts: [host("author-grace-adengaa"), host("author-ibrahim-tampuole")],
    schedule: [
      { day: "saturday", start: "17:00", end: "19:00" },
      { day: "sunday", start: "17:00", end: "19:00" },
    ],
    image: {
      src: "/assets/images/show-weekend-sundown.jpg",
      alt: "A band playing an outdoor set",
    },
    category: desk("entertainment"),
  },
  {
    id: "show-request-line-after-dark",
    slug: "request-line-after-dark",
    name: "Request Line After Dark",
    tagline: "The line stays open until the night takes over.",
    description:
      "The nightly request show, on air whenever the evening's specials are not. Requests go out in full with the caller's town, dedications are read as written, and the late gadget hour answers the technology questions the day collected. Hottest Mic takes the line at nine on Fridays; the show picks it back up at eleven.",
    hosts: [host("author-grace-adengaa"), host("author-solomon-geyidonyah")],
    schedule: [
      { day: "monday", start: "20:00", end: "24:00" },
      { day: "tuesday", start: "20:00", end: "24:00" },
      { day: "wednesday", start: "20:00", end: "24:00" },
      { day: "thursday", start: "20:00", end: "24:00" },
      { day: "friday", start: "20:00", end: "21:00" },
      { day: "friday", start: "23:00", end: "24:00" },
      { day: "saturday", start: "21:00", end: "24:00" },
      { day: "sunday", start: "21:00", end: "24:00" },
    ],
    image: {
      src: "/assets/images/show-request-line-after-dark.jpg",
      alt: "A crowd silhouetted under red stage lights",
    },
    category: desk("entertainment"),
  },
];

/** Date.getDay() is 0 = Sunday; align our ordering with that. */
const WEEKDAY_ORDER: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function getShowBySlug(slug: string): Show | undefined {
  return shows.find((show) => show.slug === slug);
}

export function getShowById(id: string): Show | undefined {
  return shows.find((show) => show.id === id);
}

export function getShows(limit?: number): Show[] {
  return typeof limit === "number" ? shows.slice(0, limit) : shows;
}

/**
 * Which show is live right now. Returns null in the gaps between shows.
 * On statically generated routes this evaluates at build/revalidation time.
 */
export function getCurrentShow(now: Date = new Date()): Show | null {
  const day = WEEKDAY_ORDER[now.getDay()];
  const minutes = now.getHours() * 60 + now.getMinutes();

  for (const show of shows) {
    for (const slot of show.schedule) {
      if (slot.day !== day) continue;
      const [startH, startM] = slot.start.split(":").map(Number);
      const [endH, endM] = slot.end.split(":").map(Number);
      const start = startH * 60 + startM;
      let end = endH * 60 + endM;
      if (end <= start) end += 24 * 60; // crosses midnight
      if (minutes >= start && minutes < end) return show;
    }
  }
  return null;
}

/** The next show that starts today or tomorrow, for the on-air strip. */
export function getNextShow(now: Date = new Date()): { show: Show; slot: Show["schedule"][number] } | null {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const dayIndex = now.getDay();

  for (let offset = 0; offset <= 7; offset += 1) {
    const day = WEEKDAY_ORDER[(dayIndex + offset) % 7];
    for (const show of shows) {
      for (const slot of show.schedule) {
        if (slot.day !== day) continue;
        const [startH, startM] = slot.start.split(":").map(Number);
        const start = startH * 60 + startM;
        if (offset > 0 || start > minutes) return { show, slot };
      }
    }
  }
  return null;
}
