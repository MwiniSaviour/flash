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
  id: string;
  label: string;
  icon: IconName;
};

/** The sections of each console, in the order the manager works through them. */
export const CONSOLE_SECTIONS: Record<ConsoleKind, ConsoleSection[]> = {
  restaurant: [
    { id: "orders", label: "Orders", icon: "receipt" },
    { id: "menu", label: "What you cook", icon: "bowl" },
    { id: "offer", label: "This week's offer", icon: "lightning" },
    { id: "storefront", label: "Your storefront", icon: "store" },
  ],
  events: [
    { id: "tickets", label: "Tickets", icon: "ticket" },
    { id: "events", label: "Your events", icon: "calendar" },
  ],
};

export const CONSOLE_LABEL: Record<ConsoleKind, string> = {
  restaurant: "Your kitchen",
  events: "Your events",
};

/** A business that has a console at all. Drivers do not. */
export function isConsoleBusiness(
  business: Business,
): business is Business & { kind: ConsoleKind } {
  return business.kind === "restaurant" || business.kind === "events";
}

/** Every business a console URL can name. */
export function consoleHref(kind: ConsoleKind, businessId: string): string {
  return `/dashboard/${kind}/${businessId}`;
}
