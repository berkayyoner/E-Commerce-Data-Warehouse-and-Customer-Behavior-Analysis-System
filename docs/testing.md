# Testing

Four layers of tests, from the code up to the whole running system.

| Layer | Tool | Count | Needs the running system |
|---|---|---|---|
| Back-end unit tests | JUnit 5, Mockito, MockMvc | 336 | No |
| Front-end unit tests | Jest, Testing Library | 343 (console 193, portal 150) | No |
| API tests | Postman collections (run with newman) | 55 requests, 48 checks | Yes |
| Browser tests | Selenium (Node, Mocha, headless Chrome) | 63 | Yes |
| Data tests | SQL reconciliation of the warehouse with the OLTP schema, ETL quality checks | 10 + 6 per ETL run | Yes (Oracle) |

## Back-end unit tests

`mvn test` from the repository root runs every service. Per service: shop 146, segmentation 93, analytics 56,
etl 22, auth 19. They cover:

- controllers (status codes, validation, error format) with a standalone MockMvc and mocked services,
- services (business rules such as the guards against deleting used products, last administrator protection, single
  active ETL run),
- the algorithms (K-Means, elbow selection, RFM rules),
- security helpers (role and scope conversion, lazy token decoder, registered OAuth clients),
- query construction (whitelisted sort and period values, only bound values for user input, search query shape).

The tests need no database. SQL is verified by the live checks below.

## Front-end unit tests

`npm test -- --watchAll=false` inside `web/dwh-admin-web` or `web/analytics-portal-web`: PKCE, token handling and
silent sign-in, role guards, tables (sorting, search box on the left with the magnifier icon, create button on the
right), forms, every page with mocked services, charts and their table alternatives, locale files (English and Turkish
have identical keys and no emoji).

## API tests (Postman)

Collections live next to each service (`services/<name>/postman`), environments in `postman/environments`; see
`postman/README.md`. They check status codes, error bodies, access control (a request without a token is refused)
and the main flows. Requests that create data delete it again; the ETL collection starts an incremental run, never a
full rebuild.

## Browser tests (Selenium)

`e2e-tests/` drives Chrome against the running system (`scripts/start-local.ps1`): sign in through the auth server,
dashboards, every console page, table sorting and searching, create and delete flows, role restrictions (administrator,
analyst, viewer each in a fresh browser), language switching, deep links, the product search, and mobile and tablet
layouts (no horizontal scroll, stacked cards, touch targets of at least 44 px). Each test file uses a fresh browser
profile, test data is removed afterwards, failed tests leave a screenshot in `e2e-tests/screenshots`.

```powershell
.\scripts\start-local.ps1
cd e2e-tests
npm install
npm test
```

## Data tests

- Every ETL run ends with six checks (orders, lines, revenue, customers, no double current rows); the result is
  stored per run and shown in the personnel console.
- `database/scripts/run-reconciliation.ps1` repeats the comparison independently and also checks units sold,
  delivered orders, revenue per month and the monthly materialized view against the fact table. It fails when any
  number differs. It found real drift during development: rows added to the OLTP schema by tests before the next ETL
  run.

## Findings that the tests produced

The tests found defects that unit tests could not see; all were fixed:

- a reserved Oracle word (`share`) used as a column alias made three reports fail (unit tests do not run SQL),
- delivered TPC-C order lines carry an amount of zero, which made the revenue of most months zero,
- the Postman collections sent the token on "without a token" requests, created warehouses and customers without
  removing them and started a full ETL rebuild,
- the service pages lost the open page after a reload because public OAuth clients get no refresh token,
- Turkish category names were shown in English in the product search of the console,
- touch targets of the segmented buttons were 36 px high on phones.
