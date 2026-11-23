# Analytics Service

Spring Boot service (Java 21, port 8083) that answers the business questions of the warehouse: revenue, sales trends,
products, categories, regions, payments, fulfillment and customer value. It reads the star schema `DWH_OLAP` with
`JdbcTemplate` and caches every report in Redis. It never writes to the warehouse.

## Security

The service is an OAuth 2.0 resource server. Every request under `/api/analytics/**` needs a bearer access token
from the auth service. Each entry of the `roles` claim becomes `ROLE_<name>`, and each entry of the `scope` claim
becomes `SCOPE_<name>`.

| Method | Path | Allowed |
|---|---|---|
| GET | `/api/analytics/**` (overview, sales, products, categories, regions, payments, fulfillment) | `ADMIN`, `ANALYST`, `VIEWER` |
| GET | `/api/analytics/customers/**`, `/api/analytics/benchmark` | `ADMIN`, `ANALYST` |
| POST | `/api/analytics/cache/clear` | `ADMIN` or the `SCOPE_etl.run` scope |
| GET | `/actuator/health/**`, `/actuator/info` | public |

Everything else is denied. The JWT decoder is built from the issuer location without contacting the auth service
at startup, so the service starts while the auth service is down.

## REST API

All answers are JSON. Money has two decimals, shares and ratios are between 0 and 1. The optional filters `from` and
`to` are ISO dates (`yyyy-MM-dd`), both inclusive, applied to the order date. A `from` after `to`, a malformed date or
an unknown value answers `400` with a problem document.

Every cached answer carries the header `X-Cache: HIT` (served from Redis) or `X-Cache: MISS` (computed from the
warehouse).

| Method | Path | Parameters | Answer |
|---|---|---|---|
| GET | `/api/analytics/overview` | `from`, `to` | `revenue`, `orders`, `units`, `customers`, `averageOrderValue`, `deliveredShare`, `averageDeliveryDays` |
| GET | `/api/analytics/sales/trend` | `granularity` (`day`, `week`, `month`, `year`; default `month`), `from`, `to` | list of `period`, `revenue`, `orders`, `units`. Periods are `2026-03-14`, `2026-W11`, `2026-03`, `2026` |
| GET | `/api/analytics/products/top` | `by` (`revenue` or `units`), `limit` (1 to 50, default 10), `category`, `from`, `to` | list of `productId`, `name`, `category`, `brand`, `revenue`, `units` |
| GET | `/api/analytics/categories` | `from`, `to` | list of `category`, `revenue`, `units`, `share` |
| GET | `/api/analytics/regions` | `from`, `to` | list of `region`, `city`, `revenue`, `orders`, `units`, `share` |
| GET | `/api/analytics/payments` | `from`, `to` | list of `paymentMethod`, `isOnline`, `revenue`, `orders`, `share` |
| GET | `/api/analytics/fulfillment` | `from`, `to` | `placed`, `delivered`, `pending`, `deliveredShare`, `averageDeliveryDays`, `byWarehouse` |
| GET | `/api/analytics/customers/top` | `limit` (1 to 100, default 20), `from`, `to` | list of `customerId` (`warehouse-district-customer`), `name`, `region`, `orders`, `revenue`, `firstOrderDate`, `lastOrderDate` |
| GET | `/api/analytics/customers/metrics` | `from`, `to` | `customersWithOrders`, `repeatCustomers`, `repeatPurchaseRate`, `averageOrdersPerCustomer`, `averageLifetimeValue` |
| GET | `/api/analytics/benchmark` | none | three entries `OLTP schema`, `Star schema`, `Materialized view` with `rows`, `milliseconds`, `speedupVsOltp` |
| POST | `/api/analytics/cache/clear` | none | `{"deleted": n}`, the number of cached reports removed |

Definitions used by the reports:

- Revenue is the sum of `sales_amount` of the order lines. Order counts come from `fact_orders`.
- A customer is the natural key `(source_w_id, source_d_id, source_c_id)`, so slowly changing customer rows count once.
- Without a date filter, the monthly trend, the categories and the regions read the materialized view
  `mv_sales_monthly`. With a date filter they read the fact table, because the view is only monthly and cannot
  answer a partial month exactly.
- The benchmark answers the same question (revenue and units per month and category) on the OLTP tables, the star
  schema and the view. It is never cached.

## Caching

Every report except the benchmark is cached in Redis for six hours.

- The key is `report:<data version>:<report>:<parameters>`. The data version is
  `SELECT NVL(MAX(run_id), 0) FROM etl_run WHERE status = 'SUCCESS'`. When the ETL service finishes a new run, the
  version changes and all older entries become unreachable, without any call between the services.
- The data version is read at most once every ten seconds per instance.
- A Redis read or write failure, or a value that cannot be read back, is logged as a warning and the report is
  computed from the warehouse. The cache never fails a request.
- `POST /api/analytics/cache/clear` scans the keys `report:*` with `SCAN` and deletes them in batches of 500.

## Configuration

| Variable | Default (local profile) | Meaning |
|---|---|---|
| `ANALYTICS_DB_USERNAME` | `dwh_reader` | Read-only database account (select on the star schema and the OLTP tables) |
| `ANALYTICS_DB_PASSWORD` | none | Password of the database account |
| `ANALYTICS_DB_SCHEMA` | `DWH_OLAP` | Schema that holds the star schema; every connection switches to it |
| `DB_HOST`, `DB_PORT`, `DB_SERVICE` | `localhost`, `1521`, `FREEPDB1` | Oracle connection |
| `OLTP_SCHEMA` | `DWH_OLTP` | Schema of the OLTP tables used by the benchmark |
| `REDIS_HOST`, `REDIS_PORT` | `localhost`, `6379` | Redis connection |
| `REDIS_PASSWORD` | empty | Redis password |
| `AUTH_ISSUER` | `http://localhost:9000` | Issuer of the access tokens |
| `ANALYTICS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Browser origins allowed by CORS |

Profiles: `local` (default), `development`, `production`. The `production` profile has no fallback values: every
connection setting must come from the environment.

## Build and test

From the repository root:

```
mvn -f services/analytics-service/pom.xml -B test
```

The tests need neither Oracle nor Redis. The SQL is checked for its structure (fixed fragments, bound parameters); it
has not been executed against the warehouse by these tests.

A Postman collection is in `postman/`; choose an environment from `postman/environments` and read `postman/README.md` (both in the repository root) for the sign in.

## Docker

Build from the repository root:

```
docker build -f services/analytics-service/Dockerfile -t analytics-service .
```

## Measured on the 10 warehouse data set

The `/api/analytics/benchmark` endpoint runs the same question (revenue per month and category, 280 rows) on three
sources. Average of three runs on a developer laptop:

| Source | Time |
|---|---|
| OLTP tables (`order_line` join `oorder` join `item`) | about 1.6 s |
| Star schema (`fact_sales` join `dim_date` join `dim_product`) | about 1.9 s |
| Materialized view `mv_sales_monthly` | about 4 ms |

Both full scans read 3 million rows, so the star schema alone is not faster than the OLTP tables at this size. The
gain comes from pre-aggregation: the view answers the question about 360 times faster, and Redis then answers a
repeated report in about 20 ms.
