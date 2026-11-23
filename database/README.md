# Database

Three Oracle accounts hold the data: `dwh_oltp` (TPC-C tables), `dwh_olap` (star schema) and `dwh_app` (users). The
read-only account `dwh_reader` is used by the report service. `init/` creates the accounts on the first start.

- `seed/` loads TPC-C with BenchBase and runs `enrichment/01_enrich_oltp.sql`, which adds categories, brands, regions,
  dates and payment methods. `docker compose up` does this once; `SCALE_FACTOR` (default 10 warehouses) and
  `WORKLOAD_SECONDS` can be set in `.env`.
- `migrations/olap` and `migrations/app` are Flyway scripts. A new change is a new file with the next version number
  and must grant `select` on new tables to `dwh_reader`.
- `tests/reconciliation.sql` compares the warehouse with the OLTP tables; run it with
  `scripts/run-reconciliation.ps1`.
- `scripts/load-oltp.ps1` and `scripts/migrate-database.ps1` do the same steps by hand against a local database.
