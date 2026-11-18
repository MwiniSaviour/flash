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
