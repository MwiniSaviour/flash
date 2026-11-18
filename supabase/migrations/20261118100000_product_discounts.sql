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
