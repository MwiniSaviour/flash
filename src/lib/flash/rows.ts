/**
 * The row shapes.
 *
 * These mirror the snake_case columns of `src/lib/supabase/schema.sql` — the
 * migration is the source of truth, and these interfaces are its TypeScript
 * twin. The repository owns the translation from rows to view models, so no
 * screen ever sees a snake_case column.
 */

export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  avatar_src: string;
  avatar_alt: string;
  member_since: string;
  notifications_enabled: boolean;
}

export interface BusinessRow {
  id: string;
  user_id: string;
  kind: string;
  name: string;
  email: string;
  phone: string;
  neighbourhood: string;
  about: string;
  status: string;
  created_at: string;
  decided_at: string | null;
}

export interface EventRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  venue: string;
  neighbourhood: string;
  city: string;
  distance_km: number;
  event_date: string;
  start_time: string;
  end_time: string;
  image_src: string;
  image_alt: string;
  categories: string[];
  featured: boolean;
  trending: boolean;
  live: boolean;
  price_from: number;
  going: number;
  capacity: number;
  owner_user_id: string | null;
  business_id: string | null;
  discount_percent: number;
}

export interface TicketTierRow {
  id: string;
  event_id: string;
  name: string;
  description: string;
  price: number;
  perks: string[];
  available: number;
  sales_closed: boolean;
  discount_percent: number;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
}

export interface EventWithTiersRow extends EventRow {
  event_tiers: TicketTierRow[];
}

export interface TicketRow {
  id: string;
  user_id: string;
  event_id: string;
  tier_id: string | null;
  tier_name: string;
  quantity: number;
  status: string;
  reference: string;
  purchased_at: string;
  unit_price_pesewas: number;
}

export interface RestaurantRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  cuisine: string;
  neighbourhood: string;
  rating: number;
  rating_count: number;
  delivery_fee: number;
  eta_minutes: number;
  distance_km: number;
  badge: string | null;
  discount_percent: number;
  owner_user_id: string | null;
  business_id: string | null;
  image_src: string;
  image_alt: string;
}

export interface MenuItemRow {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  tagline: string;
  price: number;
  image_src: string;
  image_alt: string;
  popular: boolean;
  vegetarian: boolean;
  tags: string[];
  discount_percent: number;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
}

export interface MenuItemSizeRow {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  position: number;
}

export interface MenuItemToppingRow {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  position: number;
}

export interface MenuItemWithOptionsRow extends MenuItemRow {
  menu_item_sizes: MenuItemSizeRow[];
  menu_item_toppings: MenuItemToppingRow[];
}

export interface RestaurantWithMenuRow extends RestaurantRow {
  menu_items: MenuItemWithOptionsRow[];
}

export interface DriverRow {
  id: string;
  name: string;
  rating: number;
  photo_src: string;
  photo_alt: string;
  plate: string;
  vehicle: string;
  completed_rides: number;
}

export interface OrderRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  rider_id: string | null;
  number: string;
  fulfilment: string;
  status: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  address: string;
  eta_minutes: number;
  reference: string;
  placed_at: string;
}

export interface OrderLineRow {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  size: string;
  toppings: string[];
  quantity: number;
  price: number;
}

export interface OrderWithLinesRow extends OrderRow {
  order_lines: OrderLineRow[];
  restaurants: RestaurantRow | null;
  drivers: DriverRow | null;
}

/** The dispatch snapshot both ride and parcel rows carry. */
export interface DispatchRowFields {
  dispatch_job_id: string | null;
  dispatch_app_id: string | null;
  dispatch_task_id: string | null;
  /** Raw engine task state; `status` holds Flash's mapped state. */
  dispatch_task_status: string | null;
  dispatch_status_synced_at: string | null;
  dispatch_last_payload: Record<string, unknown>;
  dispatch_idempotency_key: string | null;
}

export interface RideRow extends DispatchRowFields {
  id: string;
  user_id: string;
  rider_id: string | null;
  ride_class: string;
  pickup: string;
  pickup_area: string;
  dropoff: string;
  dropoff_area: string;
  distance_km: number;
  duration_minutes: number;
  eta_minutes: number;
  price: number;
  /** How many are travelling. */
  passengers: number;
  status: string;
  number: string;
  reference: string;
  /** ISO instant for a future pick-up; null for an immediate ride. */
  scheduled_for: string | null;
  requested_at: string;
}

export interface RideWithRiderRow extends RideRow {
  drivers: DriverRow | null;
  ride_classes: { id: string; name: string } | null;
}

export interface ParcelRow extends DispatchRowFields {
  id: string;
  user_id: string;
  courier_id: string | null;
  parcel_type: string;
  parcel_size: string;
  /** How many parcels the booking carries. */
  quantity: number;
  /** Who the courier hands the parcel to. */
  recipient_name: string;
  recipient_phone: string;
  /** What is inside, in the sender's own words. */
  details: string;
  pickup: string;
  pickup_area: string;
  dropoff: string;
  dropoff_area: string;
  distance_km: number;
  price: number;
  eta_minutes: number;
  status: string;
  tracking_number: string;
  scheduled_for: string | null;
  requested_at: string;
}

export interface ParcelWithCourierRow extends ParcelRow {
  drivers: DriverRow | null;
}

export interface SavedPlaceRow {
  user_id: string;
  id: string;
  label: string;
  detail: string;
  position: number;
}

export interface RideClassRow {
  id: string;
  name: string;
  description: string;
  seats: number;
  eta_minutes: number;
  price: number;
  perk: string;
  position: number;
}

export interface TicketRequestRow {
  id: string;
  event_id: string;
  tier_id: string;
  user_id: string | null;
  name: string;
  phone: string;
  email: string;
  quantity: number;
  status: string;
  note: string;
  created_at: string;
  decided_at: string | null;
}
