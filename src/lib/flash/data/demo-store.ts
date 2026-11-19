import type { Business, Event, Order, Restaurant, Ticket, TicketRequest } from "@/lib/flash/types";

/**
 * Shared demo data.
 *
 * Server actions and page renders can end up in different server bundles. Each
 * gets its own copy of a module-level array, so a dish added by an action would
 * otherwise be invisible to the next render. Keeping the mutable fixture
 * arrays on `globalThis` gives every bundle the same set of demo rows.
 *
 * This is demo-only: when Postgres is configured nothing reads these arrays.
 */
export type DemoStore = {
  restaurants: Restaurant[] | null;
  events: Event[] | null;
  businesses: Business[] | null;
  orders: Order[] | null;
  tickets: Ticket[] | null;
  ticketRequests: TicketRequest[] | null;
};

const host = globalThis as typeof globalThis & { __flashDemoStore?: DemoStore };

export const demoStore: DemoStore =
  host.__flashDemoStore ??
  (host.__flashDemoStore = {
    restaurants: null,
    events: null,
    businesses: null,
    orders: null,
    tickets: null,
    ticketRequests: null,
  });
