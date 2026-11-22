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
