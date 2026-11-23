# ETL Service

Spring Boot service (Java 21) that loads the OLTP shop data (`dwh_oltp`) into the star schema (`dwh_olap`).

## How a run works

Every step is one set based SQL statement that Oracle runs itself, so millions of rows are never pulled through the JVM.

| Step | What it does |
|---|---|
| Empty fact tables | Full run only: clears `fact_sales` and `fact_orders` and the watermark |
| Load warehouse / product dimension | `MERGE` that inserts new rows and updates changed ones |
| Load customer dimension | Slowly changing dimension type 2: closes the row of a customer whose city or region changed and adds a new current row |
| Load order facts / sales facts | Inserts the orders that are newer than the watermark |
| Refresh order / line delivery | Incremental run only: copies deliveries that happened after an order was loaded |
| Load inventory snapshot | Replaces today's stock snapshot |

After the load the service compares the warehouse with the OLTP schema (order count, line count, sales amount,
customer rows) and stores the result per check. An incremental run on an empty warehouse becomes a full run.

With the 10 warehouse data set a full run loads 4.75 million rows in about 8 minutes.

## REST API

| Method | Path | Description |
|---|---|---|
| POST | `/api/etl/runs` | Body `{"runType": "FULL"}` or `"INCREMENTAL"`. Answers `202` with the run, `409` while another run is active |
| GET | `/api/etl/runs?page=0&size=20` | Runs, newest first |
| GET | `/api/etl/runs/{id}` | One run with its steps and quality checks |

A Postman collection is in `postman/`.

## Configuration

| Variable | Default (local profile) | Meaning |
|---|---|---|
| `OLAP_PASSWORD` | none | Password of the `dwh_olap` account |
| `OLAP_USERNAME` | `dwh_olap` | Warehouse account |
| `DB_HOST`, `DB_PORT`, `DB_SERVICE` | `localhost`, `1521`, `FREEPDB1` | Oracle connection |
| `OLTP_SCHEMA` | `DWH_OLTP` | Schema that holds the source tables |

Profiles: `local` (default), `development`, `production`. The production profile has no fallback values.

## Run it

```bash
mvn -pl services/etl-service package
OLAP_PASSWORD=... java -jar services/etl-service/target/etl-service-0.1.0-SNAPSHOT.jar
```

The service listens on port 8081.
