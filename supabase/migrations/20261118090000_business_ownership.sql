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
