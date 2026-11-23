#!/bin/bash
# Fills the OLTP schema once. A marker table is written at the very end, so an interrupted load starts over
# and a finished one is skipped on every later start.
set -euo pipefail

DB_HOST="${DB_HOST:-oracle-db}"
DB_PORT="${DB_PORT:-1521}"
SCALE_FACTOR="${SCALE_FACTOR:-10}"
WORKLOAD_SECONDS="${WORKLOAD_SECONDS:-120}"
TERMINALS="${TERMINALS:-8}"
CONNECT="dwh_oltp/${OLTP_PASSWORD}@//${DB_HOST}:${DB_PORT}/FREEPDB1"
SQL=/opt/sqlcl/bin/sql

run_sql() {
    printf '%s\nexit\n' "$1" > /tmp/query.sql
    "$SQL" -S "$CONNECT" @/tmp/query.sql
}

echo "Waiting for the database..."
for attempt in $(seq 1 60); do
    if run_sql "select 1 from dual;" > /dev/null 2>&1; then break; fi
    sleep 5
done

if run_sql "select 'MARKER_FOUND' from user_tables where table_name = 'SEED_STATE';" | grep -q MARKER_FOUND; then
    echo "The OLTP data is already loaded."
    exit 0
fi

sed -e "s|@DB_HOST@|${DB_HOST}|" -e "s|@DB_PORT@|${DB_PORT}|" -e "s|@OLTP_PASSWORD@|${OLTP_PASSWORD}|" \
    -e "s|@SCALE_FACTOR@|${SCALE_FACTOR}|" -e "s|@TERMINALS@|${TERMINALS}|" \
    -e "s|@WORKLOAD_SECONDS@|$(( WORKLOAD_SECONDS > 0 ? WORKLOAD_SECONDS : 1 ))|" \
    /seed/tpcc_oracle.xml > /tmp/tpcc.xml

echo "Creating and loading TPC-C with ${SCALE_FACTOR} warehouses..."
java -jar benchbase.jar -b tpcc -c /tmp/tpcc.xml --create=true --load=true

if [ "$WORKLOAD_SECONDS" -gt 0 ]; then
    echo "Running the transaction workload for ${WORKLOAD_SECONDS} seconds..."
    java -jar benchbase.jar -b tpcc -c /tmp/tpcc.xml --execute=true
fi

echo "Enriching the data for e-commerce analysis..."
"$SQL" -S "$CONNECT" @/seed/01_enrich_oltp.sql

run_sql "create table seed_state (loaded_at timestamp default systimestamp not null, scale_factor number not null);
insert into seed_state (scale_factor) values (${SCALE_FACTOR});
commit;"
echo "OLTP data is ready."
