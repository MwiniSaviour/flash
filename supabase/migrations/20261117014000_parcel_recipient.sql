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
