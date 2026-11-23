# Demo script

A walk through the system in about 15 minutes. Slide numbers refer to `docs/presentation/Veri-Ambari-Sunum.pptx`.

## Before the demo (10 minutes earlier)

```powershell
docker compose up -d oracle-db redis elasticsearch
.\scripts\start-local.ps1
```

- Wait for the line "Everything is up".
- Open two browser windows: http://localhost:3001 (personnel console) and http://localhost:3000 (analytics portal).
- Sign in to both with the administrator account (`admin`; the password was given to the auth service at start).
- Check that the dashboard shows revenue TRY 770,123,295 and that the last ETL run is `SUCCESS`.
- Optional safety net: `.\database\scripts\run-reconciliation.ps1` must end with "The warehouse matches the OLTP schema."

## 1. The problem and the data (slides 2-3, 2 minutes)

Say: the assignment starts from an OLTP benchmark, TPC-C. It describes a wholesaler, so the data was enriched into shop
data: categories, brands, regions, dates over almost three years, payment methods and repeat customers. 10 warehouses,
300,000 customers, 100,000 products, 304,519 orders, 3 million order lines.

Show: console, Customers page (300,000 rows, sort by balance, search a last name), Orders page (open an order and its
lines). This is the OLTP side, read through the shop service.

## 2. Star schema and ETL (slides 5-7, 3 minutes)

Show: console, **ETL Runs**. Open the newest run: the steps with row counts and times, the six quality checks, all
passing. Say that every step is one SQL statement inside Oracle, that incremental runs only take new orders, and that
a nightly job starts one.

Do not start a full run on stage (8 minutes or more). If asked, an incremental run is safe (about 3 minutes):
click **Start run**, choose Incremental. A second click while it runs is refused with a message.

Optional proof of correctness: run `.\database\scripts\run-reconciliation.ps1` in a terminal and show the table of ten OK
lines.

## 3. Reports and speed (slides 8-9, 3 minutes)

Show: portal, **Sales overview**. Switch Last 30 days, Last 12 months, All time; switch the trend between month and
week; press "Show as table" under the chart (the chart has an accessible table alternative). Point at the top products
and the category and region bars.

Then, in a terminal or Postman: `GET /api/analytics/benchmark` (administrator token). Explain the three times: OLTP
tables and star schema are in the same range, the materialized view is hundreds of times faster, repeated reports come
from Redis. Say honestly that the star schema alone does not make this query faster at 3 million rows; the value is in
pre-aggregation, partitions and a model that analysts can understand.

## 4. Customer segments (slides 10-11, 3 minutes)

Show: console, **Segments**. The seven RFM segments and their revenue (champions: 12 % of the customers, 37 % of the
revenue), the 5x5 heat grid, the K-Means elbow chart and the four clusters, then the customer table filtered by
"At Risk". Say which group a campaign should target first (At Risk: they spent as much as loyal customers but have not
ordered for about 1.8 years).

If time allows, as administrator press **Run segmentation** (about 20 seconds) and watch the status.

## 5. Search, roles and languages (slides 12-15, 3 minutes)

- Portal, **Product search**: type `kitchen`, then switch the language to Turkish and search `mutfak` (the category label
  becomes "Ev ve Mutfak"); use a facet and the price filter; the suggestions appear while typing.
- Console, **Products**, Smart search view: the same index; **Rebuild search index** (administrator) takes 11 seconds.
- Roles: sign out, sign in as an analyst (create one on the Users page first): no Users page, no create buttons.
- Phone layout: shrink the portal window to phone width (or use the device toolbar): stacked cards, menu button.

## 6. Quality and deployment (slides 16-17, 1 minute)

Show `docs/testing.md` (336 + 343 unit tests, 63 browser tests, Postman, reconciliation) and `deploy/README.md`
(Docker, Kubernetes, GitLab pipeline). Optional: to show the browser tests run
`cd e2e-tests; npm test` (about 1 minute, Chrome opens only with `E2E_HEADED=1`).

## If something goes wrong

| Symptom | Fix |
|---|---|
| A page shows an error card | Press Retry; check the service logs in `logs/` |
| Dashboard figures are empty | An ETL run may be active: wait for it, or check `ETL Runs` |
| Sign in loops back to the sign-in card | The auth server is not up yet: wait for `http://localhost:9000/actuator/health` |
| Everything is slow after a restart | Redis is cold; the first requests fill the cache |

## After the demo

```powershell
.\scripts\stop-local.ps1
```
