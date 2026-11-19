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
