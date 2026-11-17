-- Flash — how many parcels a booking carries.
--
-- The parcel screen asks how many parcels are going, and every parcel is
-- charged on its own, so the count is what moves the price. The server keeps
-- the count with the booking so the receipt and the tracker agree.

alter table public.parcels
  add column quantity integer not null default 1;

alter table public.parcels
  add constraint parcels_quantity_allowed check (quantity between 1 and 6);

comment on column public.parcels.quantity is
  'How many parcels this booking carries. Each one is charged on its own.';
