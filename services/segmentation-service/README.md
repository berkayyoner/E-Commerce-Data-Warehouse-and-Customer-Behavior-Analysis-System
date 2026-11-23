# Segmentation Service

Spring Boot service (Java 21, port 8084) that segments the customers of the warehouse. It scores every customer with
RFM (recency, frequency, monetary value), clusters the customers with K-Means and serves the results to the
dashboards. It reads the star schema `DWH_OLAP` and writes only its own result tables (`customer_segment`,
`segmentation_run`, `kmeans_elbow`, `kmeans_cluster`).

## How a run works

A run starts with `POST /api/segmentation/runs`, or nightly when the ETL service has loaded data that the latest
segmentation run did not see. The run is one record in `segmentation_run`; its status goes from `RUNNING` to
`SUCCESS` or `FAILED`. Only one run may be active at a time (`409` otherwise).

1. **Reference.** The run uses the newest `SUCCESS` ETL run. Its `as_of_date` is the day after the newest order, so a
   customer who ordered yesterday has a recency of one day.
2. **RFM.** One set based statement aggregates the orders per customer natural key
   `(source_w_id, source_d_id, source_c_id)`: recency in whole days, number of orders, sum of order amounts. The
   recency and monetary scores come from `CUME_DIST()`, so tied values share a score. The frequency score uses `PERCENT_RANK()` instead: more than half of the customers have ordered once, and they must all get the lowest frequency score rather than a middle one. The table is replaced in one transaction.
3. **K-Means.** The recency, frequency and monetary values are transformed with `ln(1 + value)` and standardized per
   column. K-Means runs for k = 2 to 8 with k-means++ seeding from a fixed seed (42), so the result is reproducible.
   Every k gives an inertia value, stored in `kmeans_elbow`.
4. **Elbow.** Both axes of the inertia curve are scaled to 0 to 1. The point farthest from the line between the first
   and the last point is the elbow, and its k is the chosen k.
5. **Clusters.** The clusters are renumbered so that cluster 0 has the highest average monetary value. Each cluster
   gets a label from its averages compared with the overall averages (rules below), and the customers receive their
   cluster id.

A run that throws an exception is marked `FAILED` with the message. A run that was still `RUNNING` when the process
stopped is marked `FAILED` at the next startup.

### RFM scores and segments

Every score runs from 1 to 5, where 5 is the best. Recency is inverted, so a recent customer has a high R score.

| Segment | Rule (R score, F score) | Meaning |
|---|---|---|
| Champions | R 4 to 5 and F 4 to 5 | Buy often and recently |
| Loyal Customers | R 3 to 5 and F 3 to 5 | Buy regularly |
| At Risk | R 1 to 2 and F 3 to 5 | Used to buy often, have not bought recently |
| New Customers | R 4 to 5 and F 1 | Bought once, recently |
| Promising | R 3 to 5 | Recent customers with few orders |
| Lost | R 1 | Last order long ago |
| Hibernating | everything else | Low activity |

The rules are checked in the order of the table and the first match wins. The same table builds the SQL CASE
expression, so the database and the Java code cannot disagree.

### Cluster labels

Recency is compared with the overall average recency, frequency and monetary value with the overall averages.

| Label | Rule |
|---|---|
| Active high value | frequency and monetary above average, recency below average |
| Lapsed high value | frequency and monetary above average, recency at or above average |
| Recent low spenders | frequency and monetary below average, recency below average |
| Dormant low value | everything else |

When two clusters get the same label, the second gets ` 2`, the third ` 3`, and so on.

## Security

The service is an OAuth 2.0 resource server. Requests under `/api/segmentation/**` need a bearer access token from the
auth service. Each entry of the `roles` claim becomes `ROLE_<name>`, and each entry of the `scope` claim becomes
`SCOPE_<name>`.

| Method | Path | Allowed |
|---|---|---|
| GET | `/api/segmentation/**` | `ADMIN`, `ANALYST` |
| POST | `/api/segmentation/runs` | `ADMIN` or the `SCOPE_etl.run` scope |
| GET | `/actuator/health/**`, `/actuator/info` | public |

Everything else is denied. The JWT decoder is built from the issuer location without contacting the auth service at
startup, so the service starts while the auth service is down.

## REST API

All answers are JSON. Money has two decimals; shares are between 0 and 1 with four decimals. Errors are problem
documents: `400` for bad parameters, `404` for an unknown run, `409` while a run is active, `503` when the warehouse
cannot be reached. A run that cannot start because the warehouse has no successful ETL run or no orders is returned
with status `FAILED` and an error message.

| Method | Path | Parameters | Answer |
|---|---|---|---|
| POST | `/api/segmentation/runs` | none | `202` with `Location` and the run |
| GET | `/api/segmentation/runs` | `page` (default 0), `size` (1 to 100, default 20) | page of runs, newest first: `content`, `total`, `page`, `size` |
| GET | `/api/segmentation/runs/{id}` | none | `run`, `elbow` (list of `k`, `inertia`), `clusters` |
| GET | `/api/segmentation/segments` | none | list of `segment`, `customers`, `share`, `averageRecencyDays`, `averageFrequency`, `averageMonetary`, `totalRevenue`, ordered by revenue |
| GET | `/api/segmentation/rfm-grid` | none | list of `recencyScore`, `frequencyScore`, `customers`, `averageMonetary` for the score combinations that exist |
| GET | `/api/segmentation/clusters` | none | `clusters` (`clusterId`, `label`, `customers`, `share`, averages), `elbow`, `chosenK` of the latest successful run |
| GET | `/api/segmentation/customers` | `segment`, `cluster`, `search`, `sort`, `direction`, `page`, `size` (1 to 100) | page of rows: `customerId` (`warehouse-district-customer`), `name`, `region`, `recencyDays`, `frequency`, `monetary`, `rScore`, `fScore`, `mScore`, `segment`, `clusterId`, `clusterLabel` |

Notes on the parameters:

- `sort` is one of `name`, `region`, `recencyDays`, `frequency`, `monetary`, `segment`, `clusterId`. The default is
  `monetary`. `direction` is `asc` or `desc`, the default is `desc`.
- `search` matches the first or the last name, ignoring case. The characters `%`, `_` and `\` are taken literally.
- `segment` must be one of the segment names above.
- The segment, cluster and customer endpoints read the latest successful run. Without one they answer empty lists
  (`chosenK` is `null`).
- The customer table joins the current customer dimension row (`is_current = 'Y'`) and the cluster labels of the
  latest successful run.

## Configuration

| Variable | Default (local profile) | Meaning |
|---|---|---|
| `OLAP_USERNAME` | `dwh_olap` | Database account that owns the star schema and the result tables |
| `OLAP_PASSWORD` | none | Password of the database account |
| `DB_HOST`, `DB_PORT`, `DB_SERVICE` | `localhost`, `1521`, `FREEPDB1` | Oracle connection |
| `AUTH_ISSUER` | `http://localhost:9000` | Issuer of the access tokens |
| `SEGMENTATION_ALLOWED_ORIGINS` | `http://localhost:3001` | Browser origins allowed by CORS |
| `segmentation.schedule-cron` (property) | `0 30 3 * * *` | When the scheduler checks for new ETL data |

Profiles: `local` (default), `development`, `production`. The `production` profile has no fallback values: every
connection setting must come from the environment.

## Build and test

From the repository root:

```
mvn -f services/segmentation-service/pom.xml -B test
```

The tests need neither Oracle nor a running auth service. The K-Means, elbow, scaling, labelling and RFM rules are
tested directly. The SQL is not executed by the tests; it has to be run against the warehouse to be verified.

A Postman collection is in `postman/`; choose an environment from `postman/environments` and read `postman/README.md` (both in the repository root) for the sign in.

## Docker

Build from the repository root:

```
docker build -f services/segmentation-service/Dockerfile -t segmentation-service .
```

The container listens on port 8084.
