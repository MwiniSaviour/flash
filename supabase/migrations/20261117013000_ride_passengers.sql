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
