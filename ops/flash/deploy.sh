#!/usr/bin/env bash
# Flash on the VPS - apply the schema and the demo data.
#
#   scp -i ~/.ssh/deploy_key -r ops/flash supabase root@72.62.158.102:/opt/
#   ssh -i ~/.ssh/deploy_key root@72.62.158.102 "bash /opt/flash/deploy.sh"
#
# The migrations are the source of truth and they are applied in order. The
# seed is generated from the demo fixtures (npm run db:seed) and is applied
# after them, so the database and the demo always tell the same story.
#
# Pass --fresh to drop the database volume and rebuild it from nothing.

set -euo pipefail

cd /opt/flash

MIGRATIONS=(20261116115441_init.sql 20261117013000_ride_passengers.sql 20261117013500_parcel_quantity.sql)

if [[ "${1:-}" == "--fresh" ]]; then
  echo "rebuilding the database from nothing"
  docker compose down -v
  docker compose up -d
  sleep 10
fi

for migration in "${MIGRATIONS[@]}"; do
  echo "--- $migration"
  docker exec -i flash-db psql -v ON_ERROR_STOP=1 -U postgres -d flash < "$migration"
done

echo "--- seed"
docker exec -i flash-db psql -v ON_ERROR_STOP=1 -U postgres -d flash < seed.sql

# PostgREST caches the schema it serves, so it is told to look again.
docker exec -i flash-db psql -v ON_ERROR_STOP=1 -U postgres -d flash <<'EOSQL'
notify pgrst, 'reload schema';
EOSQL

docker restart flash-rest >/dev/null
sleep 5

echo "--- rows"
docker exec -i flash-db psql -U postgres -d flash -Atc "
  select 'tables ' || count(*) from information_schema.tables where table_schema = 'public'
  union all
  select 'restaurants ' || count(*) from restaurants
  union all
  select 'menu_items ' || count(*) from menu_items
  union all
  select 'orders ' || count(*) from orders
  union all
  select 'rides ' || count(*) from rides
  union all
  select 'parcels ' || count(*) from parcels
  union all
  select 'businesses ' || count(*) from businesses;"

echo "flash is up"
