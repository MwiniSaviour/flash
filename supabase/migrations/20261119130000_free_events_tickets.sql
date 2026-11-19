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
