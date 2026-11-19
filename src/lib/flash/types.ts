/**
 * Flash domain types.
 *
 * These mirror the shape of the Postgres tables in `src/lib/supabase/schema.sql`
 * — snake_case columns on the way in, the camelCase view models below on the way
 * out. The repository (`src/lib/flash/repository.ts`) owns that translation, so
 * swapping the seeded fixtures for live Supabase reads never touches a screen.
 */

export type ISODate = string;
/** Local calendar date, `yyyy-mm-dd`. */
export type CalendarDate = string;
/** Local 24h time, `HH:MM`. */
export type ClockTime = string;

export interface ImageAsset {
  /** Public path, e.g. "/assets/images/event-sunset-live.jpg". */
  src: string;
  /** Descriptive alt text — required, never empty. */
  alt: string;
}

export type EventCategory =
  | "Music"
  | "Comedy"
  | "Festival"
  | "Food & Drink"
  | "Sports"
  | "Wellness"
  | "Party"
  | "Live Show";

export interface TicketTier {
  id: string;
  name: string;
  description: string;
  /** Whole cedis; the UI formats with a "GHC" prefix. */
  price: number;
  perks: string[];
  /** Units left in this tier. */
  available: number;
  /** Planner has closed sales on this tier. */
  salesClosed?: boolean;
  /** Percentage off this tier. Zero means no discount. */
  discountPercent?: number;
  /** First day the discount applies; no value means immediately. */
  discountStartsAt?: string;
  /** Last day the discount applies; no value means no expiry. */
  discountEndsAt?: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  venue: string;
  neighbourhood: string;
  city: string;
  distanceKm: number;
  date: CalendarDate;
  startTime: ClockTime;
  endTime: ClockTime;
  image: ImageAsset;
  categories: EventCategory[];
  /** The event the Events screen leads with. */
  featured: boolean;
  /** Trending — surfaces in the home carousel and trending rails. */
  trending: boolean;
  /** Doors are open now. */
  live: boolean;
  priceFrom: number;
  /** What the promoter is offering this week, off the tickets. */
  discount?: { label: string; percent: number };
  /** The account that promotes it, when the platform knows one. */
  ownerId?: string;
  /** The business that runs the event, when the platform knows one. */
  businessId?: string;
  tiers: TicketTier[];
  /** People going, and the room's capacity. */
  going: number;
  capacity: number;
}

export type TicketStatus = "confirmed" | "pending" | "used";

export interface Ticket {
  id: string;
  userId?: string;
  eventId: string;
  tierId: string;
  tierName: string;
  quantity: number;
  status: TicketStatus;
  /** Order reference printed on the ticket. */
  reference: string;
  purchasedAt: ISODate;
  /** What was charged per attendee at booking time; zero for free events. */
  unitPricePesewas?: number;
}

export type TicketRequestStatus = "pending" | "fulfilled" | "declined";

/** A request from somebody who wanted a ticket after a tier sold out. */
export interface TicketRequest {
  id: string;
  eventId: string;
  tierId: string;
  userId?: string | null;
  name: string;
  phone: string;
  email: string;
  quantity: number;
  status: TicketRequestStatus;
  note: string;
  createdAt: ISODate;
  decidedAt?: ISODate | null;
  eventTitle?: string;
  tierName?: string;
}

export type Cuisine =
  | "Ghanaian"
  | "Street Food"
  | "Grill"
  | "Seafood"
  | "Continental"
  | "Pizza"
  | "Burgers"
  | "Breakfast";

export interface MenuItemSize {
  id: string;
  /** "Regular", "Large"… */
  name: string;
  /** Whole cedis for the dish at this size. */
  price: number;
}

export interface MenuItemTopping {
  id: string;
  /** "Extra shito", "Fried egg"… */
  name: string;
  /** Whole cedis added on top of the dish. */
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: ImageAsset;
  popular: boolean;
  vegetarian: boolean;
  /** Portions the customer can choose between. The first is the default. */
  sizes: MenuItemSize[];
  /** What can be added to it, and what that costs. */
  toppings: MenuItemTopping[];
  /** The line under the dish's name — appetite, not information. */
  tagline: string;
  /** Short searchable labels the kitchen uses for the dish. */
  tags?: string[];
  /** Percentage off this dish. Zero means no discount. */
  discountPercent?: number;
  /** First day the discount applies; no value means immediately. */
  discountStartsAt?: string;
  /** Last day the discount applies; no value means no expiry. */
  discountEndsAt?: string;
}

/** How an order reaches the customer. */
export type Fulfilment = "delivery" | "pickup" | "dine_in";

/** What kind of business an account runs. */
export type BusinessKind = "restaurant" | "events" | "driver";

/** Where an application stands. */
export type BusinessStatus = "pending" | "approved" | "declined";

/**
 * A business.
 *
 * The application and the business are one record: the customer fills it in,
 * the platform approves it, and the same row then says what the account runs
 * and whether it may publish.
 */
export interface Business {
  id: string;
  userId: string;
  kind: BusinessKind;
  /** The kitchen's or promoter's name. */
  name: string;
  email: string;
  phone: string;
  neighbourhood: string;
  about: string;
  status: BusinessStatus;
  createdAt: string;
  decidedAt?: string;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  cuisine: Cuisine;
  neighbourhood: string;
  rating: number;
  ratingCount: number;
  /** Whole cedis — the base charge, before the distance is added. */
  deliveryFee: number;
  etaMinutes: number;
  distanceKm: number;
  image: ImageAsset;
  /** "Trending", "New", "Free delivery over GHC 60"… */
  badge?: string;
  /** What the kitchen is offering this week, off the food. */
  discount?: { label: string; percent: number };
  /** The account that runs the kitchen, when there is one. */
  ownerId?: string;
  /** The business that runs the kitchen, when there is one. */
  businessId?: string;
  menu: MenuItem[];
}

export type RideClassId = "flash-bike" | "flash-go" | "flash-comfort" | "flash-xl";

export interface RideClass {
  id: RideClassId;
  name: string;
  description: string;
  seats: number;
  etaMinutes: number;
  /** Whole cedis. */
  price: number;
  /** What the class is for, in one line. */
  perk: string;
}

export interface RideQuote {
  pickup: string;
  dropoff: string;
  distanceKm: number;
  durationMinutes: number;
  classes: RideClass[];
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  photo: ImageAsset;
  plate: string;
  vehicle: string;
  completedRides: number;
}

/** A pickup or drop-off shortcut. */
export interface SavedPlace {
  id: string;
  /** The short name on the chip — "Home", "Work". */
  label: string;
  /** The full address it fills in. */
  detail: string;
}

export type OrderStatus = "awaiting confirmation" | "preparing" | "on the way" | "delivered";

export interface OrderLine {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  /** The portion the customer chose. */
  size?: string;
  /** The extras the customer chose. */
  toppings?: string[];
}

export interface Order {
  id: string;
  userId?: string;
  restaurantId: string;
  /** The number the customer reads out — the order number. */
  number: string;
  /** Whether it is delivered, collected or eaten in. */
  fulfilment: Fulfilment;
  status: OrderStatus;
  lines: OrderLine[];
  /** Whole cedis. */
  subtotal: number;
  /** What the kitchen took off. */
  discount: number;
  deliveryFee: number;
  placedAt: ISODate;
  etaMinutes: number;
  address: string;
  rider: Driver;
  reference: string;
}

export type BookingKind = "ticket" | "ride" | "parcel" | "order";
export type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled";

export interface Booking {
  id: string;
  kind: BookingKind;
  title: string;
  subtitle: string;
  status: BookingStatus;
  /** When the thing happens (an event start, a ride pickup, a delivery). */
  when: ISODate;
  /** Whole cedis. */
  price: number;
  reference: string;
  image: ImageAsset;
  /** One line of supporting detail per record. */
  details: string[];
  href: string;
}

export interface FlashUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  memberSince: string;
  notificationsEnabled: boolean;
}
