#!/usr/bin/env bash
# The roles Flash's schema expects, and the PostgREST login.
#
# Supabase creates these roles for every project; a plain Postgres does not, so
# the Flash stack creates them the same way before the migration runs.
#
# The password for the `authenticator` role is the one in POSTGRES_PASSWORD, so
# nothing secret is written into the repository: the shell reads it from the
# environment the container was started with.

set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	create role anon nologin noinherit;
	create role authenticated nologin noinherit;
	create role service_role nologin noinherit bypassrls;

	create role authenticator login noinherit password '${POSTGRES_PASSWORD}';

	grant anon to authenticator;
	grant authenticated to authenticator;
	grant service_role to authenticator;

	-- PostgREST builds its schema cache as the authenticator role, so it has to
	-- be able to see the tables. The rows are still protected: every table has
	-- Row Level Security on and no policy grants anything, and the only role
	-- that reaches them is the service role.
	grant usage on schema public to anon, authenticated, authenticator, service_role;
	grant select on all tables in schema public to authenticator;

	alter default privileges in schema public grant all on tables to service_role;
	alter default privileges in schema public grant all on sequences to service_role;
	alter default privileges in schema public grant all on functions to service_role;
EOSQL
