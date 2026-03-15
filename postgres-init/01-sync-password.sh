#!/bin/bash
# This script runs on every postgres container start.
# It syncs the postgres user password with the POSTGRES_PASSWORD env var,
# preventing authentication failures when the volume was created with a different hash.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    ALTER USER $POSTGRES_USER PASSWORD '$POSTGRES_PASSWORD';
EOSQL
