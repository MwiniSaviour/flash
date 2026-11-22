-- Flash schema.
--
-- GENERATED FILE — do not edit.
-- Source: supabase/migrations (13 migrations)
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
  'Food orders. fulfilment says whether the order is delivered, collected or eaten in; a collected order carries no delivery fee. subtotal + delivery_fee is the total charged to the customer.';

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

-- supabase/migrations/20261117014000_parcel_recipient.sql
-- Flash — who a parcel is for, and what is inside it.
--
-- A courier needs a name to hand the parcel to and a number to call, and the
-- sender often wants to say what is inside. The server keeps all three with
-- the booking so the receipt, the tracker and the door all agree.

alter table public.parcels
  add column recipient_name text not null default '',
  add column recipient_phone text not null default '',
  add column details text not null default '';

comment on column public.parcels.recipient_name is
  'The person the courier hands the parcel to.';
comment on column public.parcels.recipient_phone is
  'How the courier reaches that person.';
comment on column public.parcels.details is
  'What is inside, in the sender''s own words.';

-- supabase/migrations/20261118090000_business_ownership.sql
-- ---------------------------------------------------------------------------
-- business ownership — a business runs its venue rows
--
-- Until now a console row was claimed by `owner_user_id` alone: whoever owned
-- the profile owned the kitchen or the event. That cannot tell two approved
-- businesses of the same kind apart on one account. The console reads now scope
-- by the business, and `owner_user_id` stays as the historical owner for the
-- customer-facing screens.
--
-- Rows are backfilled to the owner's oldest business of the matching kind, the
-- same row the console used to pick first. Both columns stay nullable because a
-- seeded venue (or a profile that never applied) has no business yet.
-- ---------------------------------------------------------------------------

alter table public.events
  add column business_id text references public.businesses (id) on delete cascade;

alter table public.restaurants
  add column business_id text references public.businesses (id) on delete cascade;

update public.events e
set business_id = b.id
from (
  select distinct on (user_id) id, user_id
  from public.businesses
  where kind = 'events'
  order by user_id, created_at asc, id asc
) b
where b.user_id = e.owner_user_id
  and e.business_id is null;

update public.restaurants r
set business_id = b.id
from (
  select distinct on (user_id) id, user_id
  from public.businesses
  where kind = 'restaurant'
  order by user_id, created_at asc, id asc
) b
where b.user_id = r.owner_user_id
  and r.business_id is null;

-- A kitchen belongs to at most one business; an events business may run many
-- event rows, so events keep a plain lookup index.
create unique index restaurants_business_id_key
  on public.restaurants (business_id);

create index events_business_id_idx
  on public.events (business_id);

comment on column public.events.business_id is
  'The events business that runs this event. Null for seeded rows that predate a business.';

comment on column public.restaurants.business_id is
  'The restaurant business that runs this kitchen. At most one kitchen per business.';

-- supabase/migrations/20261118100000_product_discounts.sql
-- Product-level offers. The restaurant-level discount column stays for old
-- data, but the console now edits discounts on the dish or ticket tier itself.

alter table public.menu_items add column tags text[] not null default '{}';
alter table public.menu_items add column discount_percent integer not null default 0;
alter table public.menu_items add column discount_starts_at date;
alter table public.menu_items add column discount_ends_at date;

alter table public.event_tiers add column discount_percent integer not null default 0;
alter table public.event_tiers add column discount_starts_at date;
alter table public.event_tiers add column discount_ends_at date;

alter table public.menu_items
  add constraint menu_items_discount_percent_check check (discount_percent between 0 and 100),
  add constraint menu_items_discount_window_check check (
    discount_starts_at is null or discount_ends_at is null or discount_ends_at >= discount_starts_at
  );

alter table public.event_tiers
  add constraint event_tiers_discount_percent_check check (discount_percent between 0 and 100),
  add constraint event_tiers_discount_window_check check (
    discount_starts_at is null or discount_ends_at is null or discount_ends_at >= discount_starts_at
  );

comment on column public.menu_items.tags is
  'Short searchable labels the kitchen uses to describe the dish, e.g. vegetarian or spicy.';
comment on column public.menu_items.discount_percent is
  'Percentage off this dish. Replaces the old restaurant-wide offer.';
comment on column public.menu_items.discount_starts_at is
  'First day the discount applies. Null means it applies as soon as it is saved.';
comment on column public.menu_items.discount_ends_at is
  'Last day the discount applies. Null means it does not expire.';
comment on column public.event_tiers.discount_percent is
  'Percentage off this ticket tier. Replaces the old event-wide offer.';
comment on column public.event_tiers.discount_starts_at is
  'First day the discount applies. Null means it applies as soon as it is saved.';
comment on column public.event_tiers.discount_ends_at is
  'Last day the discount applies. Null means it does not expire.';

-- supabase/migrations/20261118110000_payments_admin.sql
-- Flash — payments, commission and platform administration.
--
-- The platform is the merchant of record: one Paystack charge holds the whole
-- amount, and payouts happen after the customer confirms delivery. Commission
-- rates are data, not code, so the admin dashboard can change them.

-- Who can administer the platform.
alter table public.profiles
  add column role text not null default 'customer',
  add constraint profiles_role_allowed check (role in ('customer', 'business', 'admin')),
  add column settlement_bank text not null default '',
  add column settlement_account text not null default '',
  add column transfer_recipient_code text not null default '',
  add column recipient_verified boolean not null default false;

-- Where a driver's delivery fee is sent after confirmation.
alter table public.drivers
  add column payout_recipient_code text not null default '',
  add column payout_name text not null default '';

-- Payment state travels with the things bought.
alter table public.orders
  add column payment_reference text,
  add column commission_pesewas integer not null default 0,
  add column delivery_confirmed_at timestamptz,
  add column self_delivery boolean not null default false;

alter table public.tickets
  add column payment_reference text,
  add column commission_pesewas integer not null default 0;

-- One row holds every rate the platform charges. Basis points, not decimals.
create table public.platform_settings (
  id                                  text primary key,
  goods_commission_bps                integer not null default 300,
  self_delivery_goods_commission_bps  integer not null default 400,
  delivery_commission_bps             integer not null default 300,
  payout_hold_hours                   integer not null default 48,
  updated_at                          timestamptz not null default now(),
  constraint platform_settings_rates check (
    goods_commission_bps between 0 and 10000
    and self_delivery_goods_commission_bps between 0 and 10000
    and delivery_commission_bps between 0 and 10000
    and payout_hold_hours between 0 and 720
  )
);

insert into public.platform_settings (id) values ('platform')
  on conflict (id) do nothing;

comment on table public.platform_settings is
  'The single source for platform commission rates, in basis points.';

-- One payment per checkout attempt, whether electronic or cash on delivery.
create table public.payments (
  id                  text primary key,
  user_id             text not null references public.profiles (id) on delete cascade,
  kind                text not null,
  reference           text not null unique,
  provider            text not null default 'paystack',
  status              text not null default 'pending',
  amount_pesewas      integer not null default 0,
  commission_pesewas  integer not null default 0,
  seller_net_pesewas  integer not null default 0,
  driver_pesewas      integer not null default 0,
  order_id            text references public.orders (id) on delete set null,
  ticket_id           text references public.tickets (id) on delete set null,
  paid_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint payments_kind_allowed check (kind in ('order', 'ticket')),
  constraint payments_provider_allowed check (provider in ('paystack', 'cash')),
  constraint payments_status_allowed check (status in ('pending', 'success', 'failed', 'cash'))
);

-- Seller and driver payouts are held until delivery is confirmed.
create table public.payouts (
  id                  text primary key,
  payment_id          text not null references public.payments (id) on delete cascade,
  -- A payout goes to a seller (a Clerk id in profiles) or a driver (a driver
  -- id), so this is deliberately not a foreign key.
  user_id             text not null,
  kind                text not null,
  amount_pesewas      integer not null default 0,
  status              text not null default 'pending',
  recipient_code      text not null default '',
  transfer_code       text not null default '',
  reason              text not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  paid_at             timestamptz,
  constraint payouts_kind_allowed check (kind in ('seller', 'driver')),
  constraint payouts_status_allowed check (status in ('pending', 'processing', 'paid', 'failed'))
);

-- A signed webhook is recorded before it is processed so redelivery is safe.
create table public.paystack_events (
  id            text primary key,
  event         text not null default '',
  reference     text not null default '',
  status        text not null default 'received',
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  constraint paystack_events_status_allowed check (
    status in ('received', 'processed', 'failed', 'duplicate', 'ignored')
  )
);

create index payments_user_id_idx on public.payments (user_id);
create index payments_status_idx on public.payments (status);
create index payouts_payment_id_idx on public.payouts (payment_id);
create index payouts_status_idx on public.payouts (status);

create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create trigger payouts_set_updated_at
  before update on public.payouts
  for each row execute function public.set_updated_at();

alter table public.platform_settings enable row level security;
alter table public.payments enable row level security;
alter table public.payouts enable row level security;
alter table public.paystack_events enable row level security;

grant usage on schema public to anon, authenticated, service_role;

grant select on table public.platform_settings to anon, authenticated;
grant select on table public.payments to anon, authenticated;
grant select on table public.payouts to anon, authenticated;
grant select on table public.paystack_events to anon, authenticated;

grant select, insert, update, delete on table public.platform_settings to service_role;
grant select, insert, update, delete on table public.payments to service_role;
grant select, insert, update, delete on table public.payouts to service_role;
grant select, insert, update, delete on table public.paystack_events to service_role;

comment on table public.payments is
  'One charge per purchase. The platform collects it; payouts follow delivery confirmation.';
comment on table public.payouts is
  'Held seller and driver payouts. A driver payout is never created before the customer confirms delivery.';

-- supabase/migrations/20261119120000_dispatch_jobs.sql
-- Flash — shared dispatch for rides and parcels.
--
-- Ride and parcel jobs are posted to the ecommerce repo's dispatch engine. The
-- engine owns assignment and task state; Flash keeps the ids, a status snapshot
-- and the last payload it saw so a screen can render without the engine being
-- up. The local `status` column keeps Flash's own vocabulary (extended with the
-- states the engine sends), while `dispatch_task_status` holds the raw engine
-- state. Both are written by one adapter in src/lib/dispatch/status.ts.

-- Rides and parcels carry the same dispatch snapshot.
alter table public.rides add column dispatch_job_id text;
alter table public.rides add column dispatch_app_id text;
alter table public.rides add column dispatch_task_id text;
alter table public.rides add column dispatch_task_status text;
alter table public.rides add column dispatch_status_synced_at timestamptz;
alter table public.rides add column dispatch_last_payload jsonb not null default '{}'::jsonb;
alter table public.rides add column dispatch_idempotency_key text;
alter table public.rides add column scheduled_for timestamptz;

alter table public.parcels add column dispatch_job_id text;
alter table public.parcels add column dispatch_app_id text;
alter table public.parcels add column dispatch_task_id text;
alter table public.parcels add column dispatch_task_status text;
alter table public.parcels add column dispatch_status_synced_at timestamptz;
alter table public.parcels add column dispatch_last_payload jsonb not null default '{}'::jsonb;
alter table public.parcels add column dispatch_idempotency_key text;

-- The engine's states travel with the booking, not just in the payload.
alter table public.rides drop constraint rides_status_allowed;
alter table public.rides add constraint rides_status_allowed check (
  status in (
    'requested', 'accepted', 'arriving', 'in progress', 'completed', 'cancelled',
    'offered', 'en-route', 'scheduled', 'due'
  )
);

alter table public.parcels drop constraint parcels_status_allowed;
alter table public.parcels add constraint parcels_status_allowed check (
  status in (
    'booked', 'assigned', 'picked up', 'delivered', 'cancelled',
    'offered', 'en-route', 'scheduled', 'due'
  )
);

-- A paid ride or parcel has the same ledger row as an order or a ticket.
alter table public.payments add column ride_id text references public.rides (id) on delete set null;
alter table public.payments add column parcel_id text references public.parcels (id) on delete set null;

alter table public.payments drop constraint payments_kind_allowed;
alter table public.payments add constraint payments_kind_allowed check (
  kind in ('order', 'ticket', 'ride', 'parcel')
);

create index rides_dispatch_job_id_idx on public.rides (dispatch_job_id);
create index rides_dispatch_task_id_idx on public.rides (dispatch_task_id);
create index rides_scheduled_for_idx on public.rides (scheduled_for);
create unique index rides_dispatch_idempotency_key_idx
  on public.rides (dispatch_app_id, dispatch_idempotency_key)
  where dispatch_idempotency_key is not null;

create index parcels_dispatch_job_id_idx on public.parcels (dispatch_job_id);
create index parcels_dispatch_task_id_idx on public.parcels (dispatch_task_id);
create index parcels_scheduled_for_idx on public.parcels (scheduled_for);
create unique index parcels_dispatch_idempotency_key_idx
  on public.parcels (dispatch_app_id, dispatch_idempotency_key)
  where dispatch_idempotency_key is not null;

create index payments_ride_id_idx on public.payments (ride_id);
create index payments_parcel_id_idx on public.payments (parcel_id);

comment on column public.rides.dispatch_task_status is
  'Raw engine task state; the status column holds Flash''s mapped state.';
comment on column public.parcels.dispatch_task_status is
  'Raw engine task state; the status column holds Flash''s mapped state.';

-- supabase/migrations/20261119130000_free_events_tickets.sql
-- Flash — free events, ticket caps and commission settlement.
--
-- A tier with price = 0 is free. The attendee pays nothing; the planner owes
-- a flat per-attendee fee that they settle through Paystack. Inventory is
-- reserved in one locked transaction so a popular event cannot oversell.

-- The flat fee is data, editable by superadmin like every other rate.
alter table public.platform_settings
  add column free_event_attendee_fee_pesewas integer not null default 100;

alter table public.platform_settings
  add constraint platform_settings_free_fee_allowed
  check (free_event_attendee_fee_pesewas between 0 and 100000);

-- Planners can close sales without deleting a tier.
alter table public.event_tiers
  add column sales_closed boolean not null default false;

-- Commission on a free ticket is owed by the planner, not the buyer.
alter table public.payments
  add column payer_user_id text;

-- The price actually charged at the time of booking (0 for free tickets).
alter table public.tickets
  add column unit_price_pesewas integer not null default 0;

-- A sold-out event still takes requests, visible to planner and platform.
create table public.ticket_requests (
  id            text primary key,
  event_id      text not null references public.events (id) on delete cascade,
  tier_id       text not null references public.event_tiers (id) on delete cascade,
  user_id       text references public.profiles (id) on delete set null,
  name          text not null,
  phone         text not null default '',
  email         text not null default '',
  quantity      integer not null default 1,
  status        text not null default 'pending',
  note          text not null default '',
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,
  constraint ticket_requests_quantity_allowed check (quantity between 1 and 10),
  constraint ticket_requests_status_allowed check (status in ('pending', 'fulfilled', 'declined'))
);

create index ticket_requests_event_id_idx on public.ticket_requests (event_id);
create index ticket_requests_tier_id_idx on public.ticket_requests (tier_id);
create index ticket_requests_status_idx on public.ticket_requests (status);
create unique index ticket_requests_open_unique
  on public.ticket_requests (tier_id, user_id)
  where status = 'pending' and user_id is not null;

comment on table public.ticket_requests is
  'Requests from people who wanted a ticket after a tier sold out.';

-- One locked write reserves the ticket, moves the counters and records the
-- commissioned price. Returns the saved ticket as jsonb.
create or replace function public.reserve_ticket(
  p_tier_id text,
  p_user_id text,
  p_ticket_id text,
  p_reference text,
  p_quantity integer,
  p_unit_price_pesewas integer,
  p_commission_pesewas integer,
  p_status text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier public.event_tiers%rowtype;
  v_ticket jsonb;
begin
  select * into v_tier from public.event_tiers where id = p_tier_id for update;

  if not found then
    raise exception 'That ticket tier is no longer available.';
  end if;

  if v_tier.sales_closed then
    raise exception 'Ticket sales for this tier are closed.';
  end if;

  if v_tier.available < p_quantity then
    raise exception 'Only % tickets are left.', v_tier.available;
  end if;

  update public.event_tiers
    set available = available - p_quantity
    where id = p_tier_id;

  update public.events
    set going = going + p_quantity
    where id = v_tier.event_id;

  insert into public.tickets (
    id, user_id, event_id, tier_id, tier_name, quantity, status, reference,
    purchased_at, unit_price_pesewas, commission_pesewas
  ) values (
    p_ticket_id, p_user_id, v_tier.event_id, v_tier.id, v_tier.name,
    p_quantity, p_status, p_reference, now(), p_unit_price_pesewas,
    p_commission_pesewas
  )
  returning to_jsonb(public.tickets.*) into v_ticket;

  return v_ticket;
end;
$$;

comment on function public.reserve_ticket is
  'Atomically checks capacity, decrements available, increments going and inserts a ticket.';

-- A failed payment gives the slot back.
create or replace function public.release_ticket(p_ticket_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.tickets%rowtype;
begin
  select * into v_ticket from public.tickets where id = p_ticket_id for update;
  if not found or v_ticket.status <> 'pending' then return; end if;

  update public.event_tiers
    set available = available + v_ticket.quantity, sales_closed = false
    where id = v_ticket.tier_id;

  update public.events
    set going = greatest(0, going - v_ticket.quantity)
    where id = v_ticket.event_id;

  delete from public.tickets where id = p_ticket_id;
end;
$$;

-- Same access shape as the rest of the schema.
grant usage on schema public to anon, authenticated, service_role;

grant select on table public.ticket_requests to anon, authenticated;
grant select, insert, update, delete on table public.ticket_requests to service_role;

grant execute on function public.reserve_ticket(text, text, text, text, integer, integer, integer, text) to service_role;
grant execute on function public.release_ticket(text) to service_role;

-- supabase/migrations/20261119140000_notification_reads.sql
-- Read state for the in-app notification inbox.
--
-- Notifications themselves are derived from real rows (pending tickets, active
-- orders, business decisions, failed payments). This table stores only which
-- of those events the customer has already seen.

create table public.notification_reads (
  user_id          text not null references public.profiles (id) on delete cascade,
  notification_key text not null,
  read_at          timestamptz not null default now(),
  primary key (user_id, notification_key)
);

comment on table public.notification_reads is
  'Per-customer read state for notifications derived from platform data.';

create index notification_reads_user_id_idx on public.notification_reads (user_id);

alter table public.notification_reads enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, delete on table public.notification_reads to service_role;

-- supabase/migrations/20261119150000_business_settlement.sql
-- Flash — how a business gets paid.
--
-- The platform collects the customer's money through Paystack. Sellers are
-- paid out to the recipient they register here, so the details belong to the
-- business, not to the person's profile.

alter table public.businesses
  add column settlement_bank text not null default '',
  add column settlement_account text not null default '',
  add column settlement_type text not null default 'mobile_money',
  add column transfer_recipient_code text not null default '',
  add column settlement_verified boolean not null default false;

alter table public.businesses
  add constraint businesses_settlement_type_allowed
  check (settlement_type in ('mobile_money', 'nuban'));

comment on column public.businesses.transfer_recipient_code is
  'The Paystack transfer recipient Flash pays after a fulfilled sale.';

-- supabase/migrations/20261120100000_transport_fares.sql
-- Transport fare settings, adjustable from the superadmin console.
alter table public.platform_settings
  add column if not exists ride_per_km_pesewas integer not null default 100,
  add column if not exists parcel_per_km_pesewas integer not null default 100,
  add column if not exists delivery_per_km_pesewas integer not null default 200,
  add column if not exists delivery_base_km integer not null default 3;

alter table public.platform_settings
  add constraint platform_settings_transport_rates check (
    ride_per_km_pesewas between 0 and 100000
    and parcel_per_km_pesewas between 0 and 100000
    and delivery_per_km_pesewas between 0 and 100000
    and delivery_base_km between 0 and 50
  );
EOF

-- supabase/migrations/20261121120000_notifications.sql
-- Smart notifications: one persisted event per recipient, with the outcome of
-- each delivery channel recorded on the same row. Notifications come from real
-- writes; nothing here is invented.

create table public.notifications (
  id text primary key,
  user_id text not null references public.profiles (id) on delete cascade,
  business_id text,
  kind text not null,
  title text not null,
  body text not null,
  speak_text text,
  priority text not null default 'normal' check (priority in ('normal', 'high')),
  ref_type text,
  ref_id text,
  read_at timestamptz,
  push_status text not null default 'skipped' check (push_status in ('skipped', 'sent', 'failed')),
  email_status text not null default 'skipped' check (email_status in ('skipped', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

create table public.notification_tokens (
  token text primary key,
  user_id text not null references public.profiles (id) on delete cascade,
  platform text not null default 'web' check (platform in ('web', 'android', 'ios')),
  app_id text not null default 'flash',
  p256dh text,
  auth text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id, read_at);
create index notifications_business_created_idx on public.notifications (business_id, created_at desc);
create index notification_tokens_user_idx on public.notification_tokens (user_id);

alter table public.notifications enable row level security;
alter table public.notification_tokens enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.notifications to service_role;
grant select, insert, update, delete on table public.notification_tokens to service_role;
