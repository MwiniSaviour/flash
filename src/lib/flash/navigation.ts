import type { IconName } from "@/components/flash/Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** The ride button sits in the middle of the phone's bar, raised. */
  raised?: boolean;
}

const destinations = {
  home: { href: "/", label: "Home", icon: "home" },
  events: { href: "/events", label: "Events", icon: "events" },
  food: { href: "/food", label: "Food", icon: "food" },
  ride: { href: "/ride", label: "Ride", icon: "ride", raised: true },
  track: { href: "/track", label: "Track", icon: "track" },
  bookings: { href: "/bookings", label: "Bookings", icon: "bookings" },
} satisfies Record<string, NavItem>;

/**
 * The navigation model.
 *
 * The desktop rail carries every destination: Home, Events, Food, Ride, Track
 * and Bookings.
 */
export const navItems: NavItem[] = [
  destinations.home,
  destinations.events,
  destinations.food,
  destinations.ride,
  destinations.track,
  destinations.bookings,
];

/**
 * The phone's bottom bar: five destinations with the ride button raised out of
 * the middle — Home, Events, Ride, Food and Track.
 *
 * Food earned a tab because ordering a meal is one of the three things ScalDive
 * does, and the phone should not have to dig for it. Bookings gave its slot
 * up: the ledger is a record of what you already committed to, so it belongs
 * in the profile next to the account, which is where the phone already keeps
 * it.
 */
export const mobileTabs: NavItem[] = [
  destinations.home,
  destinations.events,
  destinations.ride,
  destinations.food,
  destinations.track,
];

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
