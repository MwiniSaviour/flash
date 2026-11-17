import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { walletEventIds, walletTicketCount } from "~/data/events";
import { events as eventFixtures, listener as listenerFixture } from "~/data/events";
import { tickets as ticketFixtures } from "~/data/events";
import { stations as stationFixtures } from "~/data/stations";
import type {
  EventItem,
  ListenerProfile,
  Station,
  Ticket,
  TicketTier,
  WalletSummary,
} from "~/lib/types";

import { apiList } from "~/lib/api";

/**
 * Content comes from the shared Payload CMS; the bundled fixtures (the exact
 * documents `npm run seed` writes) are the offline cache.
 *
 * The app therefore paints instantly from the seed data — a hard requirement for
 * a native shell that may launch with no signal — and silently upgrades to live
 * CMS content when the API answers. `source` exposes which one is on screen so
 * the UI can be honest about it instead of pretending stale data is live.
 */
export type ContentSource = "seed" | "cms";

interface ContentState {
  source: ContentSource;
  stations: Station[];
  events: EventItem[];
  tickets: Ticket[];
  listener: ListenerProfile;
  wallet: WalletSummary;
  /**
   * The most-booked event that has not happened yet — what "Trending Now"
   * surfaces. Derived from the wallet's tickets, so it moves when someone books.
   */
  trendingEvent: { event: EventItem; booked: number } | null;
  isLoading: boolean;
  /** Adds a purchase to the local wallet and persists it for the session. */
  addTickets: (input: { event: EventItem; tier: TicketTier; quantity: number }) => Ticket;
  setNotifications: (enabled: boolean) => void;
  getEvent: (idOrSlug: string) => EventItem | undefined;
  getEventForTicket: (ticket: Ticket) => EventItem | undefined;
}

const ContentContext = createContext<ContentState | null>(null);

const STORAGE_KEY = "prototype-radio-wallet-v1";

/* ------------------------------------------------------------------ mapping */

type Doc = Record<string, unknown>;

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : Number(value ?? fallback) || fallback;
}

/** Payload stores dates as ISO timestamps; the UI works with plain yyyy-mm-dd. */
function isoDay(value: unknown): string {
  const raw = str(value);
  return raw ? raw.slice(0, 10) : "";
}

function toStation(doc: Doc): Station {
  const artwork = (doc.artwork ?? {}) as Doc;
  return {
    id: str(doc.legacyId, String(doc.id)),
    slug: str(doc.slug),
    name: str(doc.name),
    frequency: str(doc.frequency),
    city: str(doc.city),
    tagline: str(doc.tagline),
    artwork: { src: str(artwork.src), alt: str(artwork.alt), credit: str(artwork.credit) || undefined },
    streamUrl: str(doc.streamUrl),
    flagship: Boolean(doc.flagship),
    live: Boolean(doc.live),
  };
}

function toEvent(doc: Doc): EventItem {
  const image = (doc.image ?? {}) as Doc;
  const tiers = Array.isArray(doc.tiers) ? (doc.tiers as Doc[]) : [];
  const amenities = Array.isArray(doc.amenities) ? (doc.amenities as Doc[]) : [];
  return {
    id: str(doc.legacyId, String(doc.id)),
    slug: str(doc.slug),
    title: str(doc.title),
    subtitle: str(doc.subtitle),
    description: str(doc.description),
    venue: str(doc.venue),
    city: str(doc.city),
    distanceKm: num(doc.distanceKm),
    date: isoDay(doc.date),
    startTime: str(doc.startTime),
    endTime: str(doc.endTime),
    image: { src: str(image.src), alt: str(image.alt), credit: str(image.credit) || undefined },
    tags: Array.isArray(doc.tags) ? (doc.tags as EventItem["tags"]) : [],
    featured: Boolean(doc.featured),
    priceFrom: num(doc.priceFrom),
    tiers: tiers.map((tier) => ({
      id: str(tier.tierId, String(tier.id)),
      name: str(tier.name),
      description: str(tier.description),
      price: num(tier.price),
      perks: Array.isArray(tier.perks) ? (tier.perks as string[]) : [],
      icon: tier.icon === "crown" ? "crown" : "ticket",
    })),
    amenities: amenities.map((amenity) => ({
      label: str(amenity.label),
      icon: (["music", "drink", "heart", "star"] as const).includes(amenity.icon as never)
        ? (amenity.icon as EventItem["amenities"][number]["icon"])
        : "star",
    })),
  };
}

function toTicket(doc: Doc): Ticket {
  // Queried at depth 1, so `event` arrives as the full event document.
  const event = (doc.event ?? {}) as Doc;
  const status = str(doc.status, "confirmed");
  return {
    id: str(doc.legacyId, String(doc.id)),
    eventId: str(event.legacyId, String(event.id ?? "")),
    tierId: str(doc.tierId),
    tierName: str(doc.tierName),
    quantity: num(doc.quantity, 1),
    status: status === "pending" || status === "past" ? status : "confirmed",
    reference: str(doc.reference),
  };
}

function toListener(doc: Doc): ListenerProfile {
  const favourites = Array.isArray(doc.favouriteStations) ? (doc.favouriteStations as Doc[]) : [];
  return {
    id: str(doc.legacyId, String(doc.id)),
    name: str(doc.name),
    email: str(doc.email),
    avatarUrl: str(doc.avatarUrl),
    favouriteStationIds: favourites.map((station) => str(station.legacyId, String(station.id))),
    notificationsEnabled: doc.notificationsEnabled !== false,
  };
}

/* ------------------------------------------------------------------ storage */

interface StoredWallet {
  tickets: Ticket[];
  notificationsEnabled?: boolean;
}

function readWallet(): StoredWallet | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredWallet;
    return Array.isArray(parsed.tickets) ? parsed : null;
  } catch {
    return null;
  }
}

function writeWallet(wallet: StoredWallet) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
  } catch {
    // Private-mode WebViews can reject writes; the session keeps working from
    // in-memory state, so a failed persist is not worth surfacing.
  }
}

/* ------------------------------------------------------------------ provider */

export function ContentProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<ContentSource>("seed");
  const [stations, setStations] = useState<Station[]>(stationFixtures);
  const [events, setEvents] = useState<EventItem[]>(eventFixtures);
  const [tickets, setTickets] = useState<Ticket[]>(() => readWallet()?.tickets ?? ticketFixtures);
  const [listener, setListener] = useState<ListenerProfile>(() => {
    const stored = readWallet();
    return stored?.notificationsEnabled === undefined
      ? listenerFixture
      : { ...listenerFixture, notificationsEnabled: stored.notificationsEnabled };
  });
  const [isLoading, setIsLoading] = useState(true);
  const hydrated = useRef(false);

  useEffect(() => {
    // Runs once per app launch. The fetches are read-only GETs, so they are not
    // cancelled on cleanup: React's StrictMode mounts effects twice in dev, and
    // aborting on the first cleanup would leave the app pinned to the fixtures.
    if (hydrated.current) return;
    hydrated.current = true;

    async function hydrate() {
      try {
        const [stationDocs, eventDocs, ticketDocs, listenerDocs] = await Promise.all([
          apiList<Doc>("/stations", { sort: "createdAt" }),
          apiList<Doc>("/events", { sort: "date" }),
          apiList<Doc>("/tickets", { depth: "1", sort: "createdAt" }),
          apiList<Doc>("/listeners", { limit: "1" }),
        ]);

        if (stationDocs.length) setStations(stationDocs.map(toStation));
        if (eventDocs.length) setEvents(eventDocs.map(toEvent));
        if (ticketDocs.length) {
          const cmsTickets = ticketDocs.map(toTicket);
          // Locally purchased tickets exist only in the device wallet; keep them
          // alongside the CMS ones instead of clobbering the user's session.
          setTickets((current) => {
            const localOnly = current.filter((ticket) => ticket.reference.startsWith("PLS-APP-"));
            return [...localOnly, ...cmsTickets];
          });
        }
        if (listenerDocs.length) {
          const profile = toListener(listenerDocs[0]);
          setListener((current) => ({ ...profile, notificationsEnabled: current.notificationsEnabled }));
        }
        setSource("cms");
      } catch {
        // Offline or the CMS is unreachable: the seeded fixtures stay on screen.
        setSource("seed");
      } finally {
        setIsLoading(false);
      }
    }

    void hydrate();
  }, []);

  const persist = useCallback((next: Ticket[], notificationsEnabled: boolean) => {
    writeWallet({ tickets: next, notificationsEnabled });
  }, []);

  const addTickets = useCallback<ContentState["addTickets"]>(
    ({ event, tier, quantity }) => {
      const reference = `PLS-APP-${Math.random().toString(36).slice(2, 6).toUpperCase()}${String(
        Date.now(),
      ).slice(-4)}`;
      const ticket: Ticket = {
        id: `ticket-local-${reference}`,
        eventId: event.id,
        tierId: tier.id,
        tierName: tier.name,
        quantity,
        status: "confirmed",
        reference,
      };
      setTickets((current) => {
        const next = [ticket, ...current];
        persist(next, listener.notificationsEnabled);
        return next;
      });
      return ticket;
    },
    [listener.notificationsEnabled, persist],
  );

  const setNotifications = useCallback(
    (enabled: boolean) => {
      setListener((current) => {
        const next = { ...current, notificationsEnabled: enabled };
        persist(tickets, enabled);
        return next;
      });
    },
    [persist, tickets],
  );

  const getEvent = useCallback(
    (idOrSlug: string) =>
      events.find((event) => event.id === idOrSlug || event.slug === idOrSlug),
    [events],
  );

  const getEventForTicket = useCallback(
    (ticket: Ticket) => events.find((event) => event.id === ticket.eventId),
    [events],
  );

  const wallet = useMemo<WalletSummary>(() => {
    const hasLocal = tickets.some((ticket) => ticket.reference.startsWith("PLS-APP-"));
    return {
      // The seeded wallet is the design's 12 tickets across 5 events; a local
      // purchase increments it rather than replacing the CMS totals.
      tickets: hasLocal ? walletTicketCount + (tickets.length - ticketFixtures.length) : walletTicketCount,
      events: hasLocal ? walletEventIds.length + 1 : walletEventIds.length,
      stations: listener.favouriteStationIds.length,
    };
  }, [listener.favouriteStationIds.length, tickets]);

  /**
   * Trending Now = the upcoming event with the most tickets booked.
   *
   * Bookings are counted from the wallet's confirmed tickets (seeded ones plus
   * anything booked in the session), so the row is a live fact rather than a
   * hand-picked fixture. Ties fall back to the soonest date, then to the
   * editor's featured pick, so the row is never empty while events exist.
   */
  const trendingEvent = useMemo(() => {
    const bookedByEvent = new Map<string, number>();
    for (const ticket of tickets) {
      if (ticket.status === "past") continue;
      bookedByEvent.set(ticket.eventId, (bookedByEvent.get(ticket.eventId) ?? 0) + ticket.quantity);
    }

    const ranked = events
      .map((event) => ({ event, booked: bookedByEvent.get(event.id) ?? 0 }))
      .sort((a, b) => {
        if (b.booked !== a.booked) return b.booked - a.booked;
        const aTime = new Date(a.event.date).getTime();
        const bTime = new Date(b.event.date).getTime();
        if (aTime !== bTime) return aTime - bTime;
        return Number(Boolean(b.event.featured)) - Number(Boolean(a.event.featured));
      });

    return ranked[0] ?? null;
  }, [events, tickets]);

  const value = useMemo<ContentState>(
    () => ({
      source,
      stations,
      events,
      tickets,
      listener,
      wallet,
      trendingEvent,
      isLoading,
      addTickets,
      setNotifications,
      getEvent,
      getEventForTicket,
    }),
    [
      addTickets,
      events,
      getEvent,
      getEventForTicket,
      isLoading,
      listener,
      setNotifications,
      source,
      stations,
      tickets,
      trendingEvent,
      wallet,
    ],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentState {
  const context = useContext(ContentContext);
  if (!context) throw new Error("useContent must be used inside <ContentProvider>");
  return context;
}
