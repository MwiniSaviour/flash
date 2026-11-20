-- Transport fare settings, adjustable from the superadmin console.
alter table public.platform_settings
  add column if not exists ride_per_km_pesewas integer not null default 120,
  add column if not exists parcel_per_km_pesewas integer not null default 100,
  add column if not exists delivery_per_km_pesewas integer not null default 200,
  add column if not exists delivery_base_km integer not null default 3;

alter table public.platform_settings
  add constraint platform_settings_transport_rates check (
    ride_per_km_pesewas between 0 and 100000
    and parcel_per_km_pesewas between 0 and 100000
    and delivery_per_km_pesewas between 0 and 100000
    and delivery_base_km between 0 and 50
  );
EOF