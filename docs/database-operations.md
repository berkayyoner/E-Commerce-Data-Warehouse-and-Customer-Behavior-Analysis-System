# Database Operations

Notes for running the Oracle database of the shop data warehouse in the three environments.

## Accounts and privileges

| Account | Created by | Rights |
|---|---|---|
| `dwh_oltp` | Docker image (`APP_USER`) | Owns the TPC-C tables, sequences and the enrichment columns |
| `dwh_olap` | `database/init/01_create_olap_user.sh` | Owns the star schema; the ETL and segmentation services write with it; `select any table` to read the OLTP schema |
| `dwh_app` | `database/init/02_create_app_user.sh` | Owns `app_user`; used by the auth service only |
| `dwh_reader` | `database/init/03_create_reader_user.sh` | `create session` plus `select` on the warehouse (migration `V7`) and on the OLTP tables (enrichment script); used by the report API |

The report API cannot change data: an `insert`, `delete` or `create table` with `dwh_reader` is refused with
ORA-01031 or ORA-41900. Its connections start with `ALTER SESSION SET CURRENT_SCHEMA = DWH_OLAP`, so the queries
use plain table names.

The init scripts run once, when the database container is created. On an existing database create the accounts by
hand with the same statements.

## Environments

| | local | development | production |
|---|---|---|---|
| Database | Docker Compose on the developer machine | shared Oracle instance | managed Oracle instance |
| Passwords | `.env` file (not committed) | GitLab CI/CD variables | Kubernetes secrets |
| Schema changes | `migrate-database.ps1` | pipeline job runs Flyway | pipeline job runs Flyway after approval |
| Data | BenchBase load script (scale factor 10) | BenchBase load, same script | the real shop data; the load script is never run |

Every service has `local`, `development` and `production` profiles. Production profiles contain no fallback values,
so a missing setting stops the service from starting.

## Connection pools

| Service | Account | Pool size (local / production) |
|---|---|---|
| etl-service | `dwh_olap` | 4 / 8 |
| segmentation-service | `dwh_olap` | 6 / 8 |
| analytics-service | `dwh_reader` | 6 / 8 |
| auth-service | `dwh_app` | 8 / 8 |
| shop-service | `dwh_oltp` | 4 / 8 |

All services use HikariCP. The ETL job runs long statements, so it uses its own account and pool and cannot
exhaust the pool of the report API.

## Query plans

Checked on the 10 warehouse data set (3 million sales rows):

- A date filtered fact query (`fact_sales` joined to `dim_date`, one quarter) uses `PARTITION RANGE JOIN-FILTER`:
  the optimizer reads only the partitions of the years involved instead of the whole table.
- The unfiltered monthly reports read `mv_sales_monthly` (2,800 rows) instead of the fact table, which is what makes
  them about 260 to 360 times faster than the same question on the OLTP tables.
- The customer ranking and the repeat purchase rate scan `fact_orders` (300,000 rows) once, grouped by the natural
  customer key; this takes about one second and the result is cached in Redis.
- `customer_segment` has indexes on the RFM segment and the cluster, which the customer table of the personnel
  console filters by.

Review the plans again (`EXPLAIN PLAN` with `DBMS_XPLAN.DISPLAY(NULL, NULL, 'BASIC +PARTITION')`) after the data
volume changes by an order of magnitude, and add a partition for the next year before January (the overflow
partition `p_future` keeps loads working in the meantime).

## Materialized view refresh

`mv_sales_monthly` is refreshed completely, on demand, by the last steps of every ETL run
(`DBMS_MVIEW.REFRESH('MV_SALES_MONTHLY', 'C')`, about 13 seconds for 3 million lines). Reports show the data of the
last successful ETL run; the report cache key contains the number of that run, so a refresh never serves stale
numbers.

## Backup and restore

Local volume backup (the container must be stopped so the files are consistent):

```powershell
docker stop dwh-oracle-db
docker run --rm -v e-commerce-data-warehouse-and-customer-behavior-analysis-system_oracle-data:/source:ro `
    -v C:\DwhBackups:/backup alpine tar czf /backup/oracle_volume_$(Get-Date -Format yyyy-MM-dd).tar.gz -C /source .
docker start dwh-oracle-db
```

Restore: stop the container, empty the volume, extract the archive into it and start the container again.

For development and production use Oracle Data Pump instead (`expdp` / `impdp` of the four accounts) or the backup
service of the managed instance, and test a restore regularly. The warehouse can always be rebuilt from the OLTP
schema with a full ETL run (about 8 minutes at scale factor 10), so the OLTP schema is the data that must be backed
up first.

## Seeding a new environment

1. Create the database and the accounts (init scripts).
2. `migrate-database.ps1 -Schema app` and `-Schema olap`.
3. Local and development only: `load-oltp.ps1` to generate the OLTP data.
4. Start the auth service with `AUTH_ADMIN_PASSWORD` set to create the first administrator.
5. Start an ETL run (`POST /api/etl/runs` with `FULL`), then a segmentation run (`POST /api/segmentation/runs`).
