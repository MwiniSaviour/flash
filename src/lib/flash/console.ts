import type { IconName } from "@/components/flash/Icon";

import type { Business } from "./types";

/**
 * The two consoles a business can own.
 *
 * A driver has no console — that surface is out of scope. Keeping this union
 * here lets the shell, the drawer and the switcher agree on what a console is.
 */
export type ConsoleKind = "restaurant" | "events";

export type ConsoleSection = {
  /** The path under the business console. Empty is the overview. */
  path: string;
  label: string;
  icon: IconName;
};

/** Each section is a real route, so the browser's back button and URLs work. */
export const CONSOLE_SECTIONS: Record<ConsoleKind, ConsoleSection[]> = {
  restaurant: [
    { path: "", label: "Overview", icon: "home" },
    { path: "orders", label: "Orders", icon: "receipt" },
    { path: "dishes", label: "Dishes", icon: "bowl" },
    { path: "customers", label: "Customers", icon: "user" },
    { path: "storefront", label: "Storefront", icon: "store" },
  ],
  events: [
    { path: "", label: "Overview", icon: "home" },
    { path: "tickets", label: "Tickets", icon: "ticket" },
    { path: "events", label: "Events", icon: "calendar" },
    { path: "ticket-types", label: "Ticket types", icon: "ticket-stub" },
    { path: "attendees", label: "Attendees", icon: "user" },
  ],
};

export const CONSOLE_LABEL: Record<ConsoleKind, string> = {
  restaurant: "Kitchen console",
  events: "Events console",
};

/** A business that has a console at all. Drivers do not. */
export function isConsoleBusiness(
  business: Business,
): business is Business & { kind: ConsoleKind } {
  return business.kind === "restaurant" || business.kind === "events";
}

/** The URL of one console section. */
export function consoleHref(kind: ConsoleKind, businessId: string, section = ""): string {
  const base = `/dashboard/${kind}/${businessId}`;
  return section ? `${base}/${section}` : base;
}
