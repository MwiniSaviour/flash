-- Seller ownership for the product tables.
--
-- The migration source of truth remains supabase/migrations/*.sql. A seller is
-- a Clerk user id, not a row invented in code. The column is initially nullable
-- so the existing seeded catalogue keeps loading; the provisioning script in
-- Task 2 assigns real owners before the application enforces ownership on every
-- write. Application code must never treat a null owner as "anyone may edit".

create table if not exists public.sellers (
  clerk_user_id text primary key,
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.sellers enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.sellers to service_role;

alter table public.events
  add column if not exists seller_user_id text references public.sellers(clerk_user_id),
  add column if not exists image_url text,
  add column if not exists image_public_id text;

alter table public.event_tiers
  add column if not exists seller_user_id text references public.sellers(clerk_user_id);

alter table public.restaurants
  add column if not exists seller_user_id text references public.sellers(clerk_user_id),
  add column if not exists image_url text,
  add column if not exists image_public_id text;

alter table public.menu_items
  add column if not exists seller_user_id text references public.sellers(clerk_user_id),
  add column if not exists image_url text,
  add column if not exists image_public_id text;

alter table public.ride_classes
  add column if not exists seller_user_id text references public.sellers(clerk_user_id);

create index if not exists events_seller_user_id_idx on public.events (seller_user_id);
create index if not exists event_tiers_seller_user_id_idx on public.event_tiers (seller_user_id);
create index if not exists restaurants_seller_user_id_idx on public.restaurants (seller_user_id);
create index if not exists menu_items_seller_user_id_idx on public.menu_items (seller_user_id);
create index if not exists ride_classes_seller_user_id_idx on public.ride_classes (seller_user_id);

comment on column public.events.seller_user_id is
  'Owning seller Clerk user id. Writes require currentUserId() to equal this value, or an admin role.';
comment on column public.event_tiers.seller_user_id is
  'Owning seller Clerk user id. Writes require currentUserId() to equal this value, or an admin role.';
comment on column public.restaurants.seller_user_id is
  'Owning seller Clerk user id. Writes require currentUserId() to equal this value, or an admin role.';
comment on column public.menu_items.seller_user_id is
  'Owning seller Clerk user id. Writes require currentUserId() to equal this value, or an admin role.';
comment on column public.ride_classes.seller_user_id is
  'Owning seller Clerk user id. Writes require currentUserId() to equal this value, or an admin role.';
