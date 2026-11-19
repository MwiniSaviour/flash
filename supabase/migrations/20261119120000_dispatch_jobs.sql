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
