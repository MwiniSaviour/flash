-- Flash schema.
--
-- GENERATED FILE — do not edit.
-- Source: supabase/migrations (3 migrations)
-- Refresh: npm run db:schema
--
-- supabase/migrations/20261116115441_init.sql
-- Flash — initial schema.
--
-- The browser never talks to Postgres. Every read and write goes through the
-- Next.js server (the repository in src/lib/flash/repository.ts), which holds
-- the only credentials in the system. Row Level Security is therefore
-- deny-all for anon/authenticated — they have no grants and no policies — and
-- the service role is the only role that can touch a table.
--
-- Conventions:
--   * ids are stable text slugs ('evt-…', 'rst-…', 'tkt-…'), minted by the
--     app for runtime rows and by the seed for demo rows;
--   * money is whole cedis (integer) — Flash never shows decimals;
--   * clock times on events are wall-clock and are stored as UTC instants;
--   * user_id holds a Clerk user id ('user_…') for signed-in customers and
--     the demo user id ('usr-saviour-mwini') for the seeded demo account.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — Clerk owns identity, this owns the product profile
-- ---------------------------------------------------------------------------

create table public.profiles (
  id                    text primary key,
  name                  text not null,
  email                 text not null,
  avatar_src            text not null default '',
  avatar_alt            text not null default '',
  member_since          text not null default '',
  notifications_enabled boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.profiles is
  'Product profile per customer. Keyed by the Clerk user id.';

-- ---------------------------------------------------------------------------
-- events + tiers — what you can go to
-- ---------------------------------------------------------------------------

create table public.events (
  id            text primary key,
  slug          text not null unique,
  title         text not null,
  subtitle      text not null default '',
  description   text not null default '',
  venue         text not null,
  neighbourhood text not null default '',
  city          text not null default 'Accra',
  distance_km   numeric(4, 1) not null default 0,
  event_date    date not null,
  start_time    time not null,
  end_time      time not null,
  image_src     text not null,
  image_alt     text not null,
  categories    text[] not null default '{}',
  featured      boolean not null default false,
  trending      boolean not null default false,
  live          boolean not null default false,
  price_from    integer not null default 0,
  going         integer not null default 0,
  capacity      integer not null default 0,
  owner_user_id text references public.profiles (id) on delete set null,
  discount_percent integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint events_slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint events_categories_allowed check (
    categories <@ array[
      'Music', 'Comedy', 'Festival', 'Food & Drink',
      'Sports', 'Wellness', 'Party', 'Live Show'
    ]::text[]
  ),
  constraint events_distance_positive check (distance_km >= 0),
  constraint events_price_positive check (price_from >= 0),
  constraint events_capacity_positive check (going >= 0 and capacity >= 0),
  constraint events_discount_range check (discount_percent >= 0 and discount_percent <= 100)
);

comment on table public.events is
  'Events on the Events screen. event_date + start_time are wall-clock and are read as UTC instants.';

create table public.event_tiers (
  id          text primary key,
  event_id    text not null references public.events (id) on delete cascade,
  name        text not null,
  description text not null default '',
  price       integer not null,
  perks       text[] not null default '{}',
  available   integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint event_tiers_price_positive check (price >= 0),
  constraint event_tiers_available_positive check (available >= 0)
);

comment on table public.event_tiers is
  'Ticket tiers per event. price is per ticket, in whole cedis.';

create table public.tickets (
  id           text primary key,
  user_id      text not null references public.profiles (id) on delete cascade,
  event_id     text not null references public.events (id) on delete restrict,
  tier_id      text references public.event_tiers (id) on delete set null,
  tier_name    text not null,
  quantity     integer not null default 1,
  status       text not null default 'confirmed',
  reference    text not null unique,
  purchased_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint tickets_quantity_range check (quantity between 1 and 10),
  constraint tickets_status_allowed check (status in ('confirmed', 'pending', 'used'))
);

comment on table public.tickets is
  'The ticket wallet. tier_name is a snapshot so a renamed tier never rewrites history.';

-- ---------------------------------------------------------------------------
-- businesses — who runs what
--
-- One record is both the application and the business: the customer fills it
-- in, the platform approves it, and the same row then says what the account
-- runs and whether it may publish. The driver side of the product is not built
-- yet, so a driver application stays a record without a console.
-- ---------------------------------------------------------------------------

create table public.businesses (
  id            text primary key,
  user_id       text not null references public.profiles (id) on delete cascade,
  kind          text not null,
  name          text not null,
  email         text not null default '',
  phone         text not null default '',
  neighbourhood text not null default '',
  about         text not null default '',
  status        text not null default 'pending',
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,
  updated_at    timestamptz not null default now(),
  constraint businesses_kind_allowed check (kind in ('restaurant', 'events', 'driver')),
  constraint businesses_status_allowed check (status in ('pending', 'approved', 'declined'))
);

comment on table public.businesses is
  'A business application and, once approved, the business itself.';

-- ---------------------------------------------------------------------------
-- restaurants + menu — what you can eat
-- ---------------------------------------------------------------------------

create table public.restaurants (
  id             text primary key,
  slug           text not null unique,
  name           text not null,
  tagline        text not null default '',
  cuisine        text not null,
  neighbourhood  text not null default '',
  rating         numeric(2, 1) not null default 0,
  rating_count   integer not null default 0,
  delivery_fee   integer not null default 0,
  eta_minutes    integer not null default 30,
  distance_km    numeric(4, 1) not null default 0,
  badge          text,
  discount_percent integer not null default 0,
  owner_user_id  text references public.profiles (id) on delete set null,
  image_src      text not null,
  image_alt      text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint restaurants_slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint restaurants_cuisine_allowed check (
    cuisine in (
      'Ghanaian', 'Street Food', 'Grill', 'Seafood',
      'Continental', 'Pizza', 'Burgers', 'Breakfast'
    )
  ),
  constraint restaurants_rating_range check (rating >= 0 and rating <= 5),
  constraint restaurants_counts_positive check (
    rating_count >= 0 and delivery_fee >= 0 and eta_minutes >= 0 and distance_km >= 0
  ),
  constraint restaurants_discount_range check (
    discount_percent >= 0 and discount_percent <= 100
  )
);

comment on table public.restaurants is
  'Kitchens on the Food screen. delivery_fee is the base charge; the app adds a per-kilometre rate for the distance beyond the base radius. discount_percent is what the kitchen takes off the food this week. Ratings and prices are demo data.';

create table public.menu_items (
  id            text primary key,
  restaurant_id text not null references public.restaurants (id) on delete cascade,
  name          text not null,
  description   text not null default '',
  tagline       text not null default '',
  price         integer not null,
  image_src     text not null,
  image_alt     text not null,
  popular       boolean not null default false,
  vegetarian    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint menu_items_price_positive check (price >= 0)
);

comment on table public.menu_items is
  'Menu lines per kitchen. price is the regular portion, in whole cedis.';

create table public.menu_item_sizes (
  id           text primary key,
  menu_item_id text not null references public.menu_items (id) on delete cascade,
  name         text not null,
  price        integer not null,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint menu_item_sizes_price_positive check (price >= 0)
);

comment on table public.menu_item_sizes is
  'The portions a dish comes in. The regular portion carries the menu price.';

create table public.menu_item_toppings (
  id           text primary key,
  menu_item_id text not null references public.menu_items (id) on delete cascade,
  name         text not null,
  price        integer not null default 0,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint menu_item_toppings_price_positive check (price >= 0)
);

comment on table public.menu_item_toppings is
  'What can be added to a dish, and what that costs.';

-- ---------------------------------------------------------------------------
-- drivers + ride classes — who drives, and what you book
-- ---------------------------------------------------------------------------

create table public.drivers (
  id              text primary key,
  name            text not null,
  rating          numeric(3, 2) not null default 0,
  photo_src       text not null default '',
  photo_alt       text not null default '',
  plate           text not null default '',
  vehicle         text not null default '',
  completed_rides integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint drivers_rating_range check (rating >= 0 and rating <= 5),
  constraint drivers_completed_positive check (completed_rides >= 0)
);

comment on table public.drivers is
  'Riders and couriers. One catalogue for rides, food runs and parcels.';

create table public.ride_classes (
  id          text primary key,
  name        text not null,
  description text not null default '',
  seats       integer not null default 1,
  eta_minutes integer not null default 10,
  price       integer not null,
  perk        text not null default '',
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint ride_classes_id_allowed check (
    id in ('flash-bike', 'flash-go', 'flash-comfort', 'flash-xl')
  ),
  constraint ride_classes_price_positive check (price >= 0 and seats > 0)
);

comment on table public.ride_classes is
  'The four ride products. price is the fare for the standard Accra route.';

-- ---------------------------------------------------------------------------
-- orders + lines — food on the way
-- ---------------------------------------------------------------------------

create table public.orders (
  id            text primary key,
  user_id       text not null references public.profiles (id) on delete cascade,
  restaurant_id text not null references public.restaurants (id) on delete restrict,
  rider_id      text references public.drivers (id) on delete set null,
  number        text not null unique,
  fulfilment    text not null default 'delivery',
  status        text not null default 'preparing',
  subtotal      integer not null default 0,
  discount      integer not null default 0,
  delivery_fee  integer not null default 0,
  address       text not null default '',
  eta_minutes   integer not null default 30,
  reference     text not null unique,
  placed_at     timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint orders_fulfilment_allowed check (fulfilment in ('delivery', 'pickup', 'dine_in')),
  constraint orders_status_allowed check (
    status in ('awaiting confirmation', 'preparing', 'on the way', 'delivered')
  ),
  constraint orders_money_positive check (subtotal >= 0 and discount >= 0 and delivery_fee >= 0),
  constraint orders_eta_positive check (eta_minutes >= 0)
);

comment on table public.orders is
  'Food orders. fulfilment says whether the order is delivered, collected or eaten in; a collected order carries no delivery fee. subtotal + delivery_fee is the total — no service fee, because no payment provider is connected.';

create table public.order_lines (
  id           text primary key,
  order_id     text not null references public.orders (id) on delete cascade,
  menu_item_id text references public.menu_items (id) on delete set null,
  name         text not null,
  size         text not null default '',
  toppings     text[] not null default '{}',
  quantity     integer not null default 1,
  price        integer not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint order_lines_quantity_positive check (quantity > 0),
  constraint order_lines_price_positive check (price >= 0)
);

comment on table public.order_lines is
  'Order lines. name, size, toppings and price are snapshots taken when the order is placed.';

-- ---------------------------------------------------------------------------
-- rides — a seat booked
-- ---------------------------------------------------------------------------

create table public.rides (
  id                text primary key,
  user_id           text not null references public.profiles (id) on delete cascade,
  rider_id          text references public.drivers (id) on delete set null,
  ride_class        text not null references public.ride_classes (id) on delete restrict,
  pickup            text not null,
  pickup_area       text not null default '',
  dropoff           text not null,
  dropoff_area      text not null default '',
  distance_km       numeric(4, 1) not null default 0,
  duration_minutes  integer not null default 0,
  eta_minutes       integer not null default 10,
  price             integer not null default 0,
  status            text not null default 'requested',
  number            text not null unique,
  reference         text not null unique,
  requested_at      timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint rides_status_allowed check (
    status in ('requested', 'accepted', 'arriving', 'in progress', 'completed', 'cancelled')
  ),
  constraint rides_money_positive check (price >= 0 and duration_minutes >= 0 and eta_minutes >= 0)
);

comment on table public.rides is
  'Booked rides. pickup/pickup_area and dropoff/dropoff_area are the street and the area, kept apart so the card can show both.';

-- ---------------------------------------------------------------------------
-- parcels — a courier run
-- ---------------------------------------------------------------------------

create table public.parcels (
  id              text primary key,
  user_id         text not null references public.profiles (id) on delete cascade,
  courier_id      text references public.drivers (id) on delete set null,
  parcel_type     text not null,
  parcel_size     text not null default 'small',
  pickup          text not null,
  pickup_area     text not null default '',
  dropoff         text not null,
  dropoff_area    text not null default '',
  distance_km     numeric(4, 1) not null default 0,
  price           integer not null default 0,
  eta_minutes     integer not null default 30,
  status          text not null default 'booked',
  tracking_number text not null unique,
  scheduled_for   timestamptz,
  requested_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint parcels_size_allowed check (parcel_size in ('small', 'medium', 'large')),
  constraint parcels_status_allowed check (status in ('booked', 'assigned', 'picked up', 'delivered')),
  constraint parcels_money_positive check (price >= 0 and eta_minutes >= 0)
);

comment on table public.parcels is
  'Courier jobs. tracking_number is what the customer reads on the card.';

-- ---------------------------------------------------------------------------
-- saved places — pickup and drop-off shortcuts
-- ---------------------------------------------------------------------------

create table public.saved_places (
  user_id    text not null references public.profiles (id) on delete cascade,
  id         text not null,
  label      text not null,
  detail     text not null default '',
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

comment on table public.saved_places is
  'Personal shortcuts for the Ride screen, scoped to the customer.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index events_event_date_idx on public.events (event_date);
create index events_featured_idx on public.events (featured) where featured;
create index events_trending_idx on public.events (trending) where trending;
create index events_owner_user_id_idx on public.events (owner_user_id);

create index event_tiers_event_id_idx on public.event_tiers (event_id);

create index tickets_user_id_idx on public.tickets (user_id);
create index tickets_event_id_idx on public.tickets (event_id);
create index tickets_status_idx on public.tickets (status);

create index menu_items_restaurant_id_idx on public.menu_items (restaurant_id);
create index menu_items_popular_idx on public.menu_items (popular) where popular;

create index menu_item_sizes_menu_item_id_idx on public.menu_item_sizes (menu_item_id);
create index menu_item_toppings_menu_item_id_idx on public.menu_item_toppings (menu_item_id);

create index orders_user_id_idx on public.orders (user_id);
create index orders_restaurant_id_idx on public.orders (restaurant_id);
create index orders_status_idx on public.orders (status);
create index orders_placed_at_idx on public.orders (placed_at desc);

create index order_lines_order_id_idx on public.order_lines (order_id);

create index rides_user_id_idx on public.rides (user_id);
create index rides_status_idx on public.rides (status);
create index rides_requested_at_idx on public.rides (requested_at desc);

create index parcels_user_id_idx on public.parcels (user_id);
create index parcels_status_idx on public.parcels (status);

create index businesses_user_id_idx on public.businesses (user_id);
create index businesses_status_idx on public.businesses (status);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger event_tiers_set_updated_at before update on public.event_tiers
  for each row execute function public.set_updated_at();
create trigger tickets_set_updated_at before update on public.tickets
  for each row execute function public.set_updated_at();
create trigger restaurants_set_updated_at before update on public.restaurants
  for each row execute function public.set_updated_at();
create trigger menu_items_set_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();
create trigger menu_item_sizes_set_updated_at before update on public.menu_item_sizes
  for each row execute function public.set_updated_at();
create trigger menu_item_toppings_set_updated_at before update on public.menu_item_toppings
  for each row execute function public.set_updated_at();
create trigger drivers_set_updated_at before update on public.drivers
  for each row execute function public.set_updated_at();
create trigger ride_classes_set_updated_at before update on public.ride_classes
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger order_lines_set_updated_at before update on public.order_lines
  for each row execute function public.set_updated_at();
create trigger rides_set_updated_at before update on public.rides
  for each row execute function public.set_updated_at();
create trigger parcels_set_updated_at before update on public.parcels
  for each row execute function public.set_updated_at();
create trigger saved_places_set_updated_at before update on public.saved_places
  for each row execute function public.set_updated_at();
create trigger businesses_set_updated_at before update on public.businesses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Access control
--
-- RLS is enabled on every table and no policy grants anything, so anon and
-- authenticated read nothing: a row is only visible to a role the table has a
-- policy for, and there are none. The service role bypasses RLS and is the
-- only role the Next.js server uses.
--
-- The anon and authenticated roles keep the ordinary select grants, because
-- that is the shape the REST layer expects: it only exposes a table it can
-- see. The grants are not the wall - Row Level Security is. A request that
-- arrives without the service role reads zero rows.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_tiers enable row level security;
alter table public.tickets enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_sizes enable row level security;
alter table public.menu_item_toppings enable row level security;
alter table public.drivers enable row level security;
alter table public.ride_classes enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.rides enable row level security;
alter table public.parcels enable row level security;
alter table public.saved_places enable row level security;
alter table public.businesses enable row level security;

grant usage on schema public to anon, authenticated, service_role;

grant select on table public.profiles to anon, authenticated;
grant select on table public.events to anon, authenticated;
grant select on table public.event_tiers to anon, authenticated;
grant select on table public.tickets to anon, authenticated;
grant select on table public.restaurants to anon, authenticated;
grant select on table public.menu_items to anon, authenticated;
grant select on table public.menu_item_sizes to anon, authenticated;
grant select on table public.menu_item_toppings to anon, authenticated;
grant select on table public.drivers to anon, authenticated;
grant select on table public.ride_classes to anon, authenticated;
grant select on table public.orders to anon, authenticated;
grant select on table public.order_lines to anon, authenticated;
grant select on table public.rides to anon, authenticated;
grant select on table public.parcels to anon, authenticated;
grant select on table public.saved_places to anon, authenticated;
grant select on table public.businesses to anon, authenticated;

grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.events to service_role;
grant select, insert, update, delete on table public.event_tiers to service_role;
grant select, insert, update, delete on table public.tickets to service_role;
grant select, insert, update, delete on table public.restaurants to service_role;
grant select, insert, update, delete on table public.menu_items to service_role;
grant select, insert, update, delete on table public.menu_item_sizes to service_role;
grant select, insert, update, delete on table public.menu_item_toppings to service_role;
grant select, insert, update, delete on table public.drivers to service_role;
grant select, insert, update, delete on table public.ride_classes to service_role;
grant select, insert, update, delete on table public.orders to service_role;
grant select, insert, update, delete on table public.order_lines to service_role;
grant select, insert, update, delete on table public.rides to service_role;
grant select, insert, update, delete on table public.parcels to service_role;
grant select, insert, update, delete on table public.saved_places to service_role;
grant select, insert, update, delete on table public.businesses to service_role;

-- supabase/migrations/20261117013000_ride_passengers.sql
-- Flash — the size of the party on a ride.
--
-- The Ride screen lets the customer say how many are travelling, and the
-- server checks that the ride they picked actually seats them. The fare still
-- follows the ride, not the head count, so this column records who is going
-- rather than what it costs.

alter table public.rides
  add column passengers integer not null default 1;

alter table public.rides
  add constraint rides_passengers_allowed check (passengers between 1 and 6);

comment on column public.rides.passengers is
  'How many are travelling. The fare follows the ride class, not this number.';

-- supabase/migrations/20261117013500_parcel_quantity.sql
-- Flash — how many parcels a booking carries.
--
-- The parcel screen asks how many parcels are going, and every parcel is
-- charged on its own, so the count is what moves the price. The server keeps
-- the count with the booking so the receipt and the tracker agree.

alter table public.parcels
  add column quantity integer not null default 1;

alter table public.parcels
  add constraint parcels_quantity_allowed check (quantity between 1 and 6);

comment on column public.parcels.quantity is
  'How many parcels this booking carries. Each one is charged on its own.';
