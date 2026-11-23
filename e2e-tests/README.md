# End-to-end tests

Selenium tests of the personnel console (http://localhost:3001) and the analytics portal (http://localhost:3000)
against the running system. The tests sign in through the authorization server (http://localhost:9000) like a
person would and drive the browser with `selenium-webdriver` and `mocha`.

## Prerequisites

- Node.js 22 or newer and npm
- Google Chrome installed (Selenium Manager downloads the matching chromedriver by itself)
- The system running: `scripts/start-local.ps1` starts the containers, the five services and both web apps
- A test administrator account. The default is `admin` with the password the start script sets
  (`Admin-Local-2026`). The warehouse data must be loaded, and the newest ETL run should be `SUCCESS`
  for the dashboard figures to be complete.

## Running

```powershell
cd e2e-tests
npm install
npm test                 # every test
npm run test:console     # personnel console only
npm run test:portal      # analytics portal only
```

Each test file opens its own Chrome session with a new, temporary profile, so no sign-in carries over
between files. Sessions run headless unless `E2E_HEADED=1` is set.

When a test fails, a screenshot is saved to `e2e-tests/screenshots/` with the name of the test.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `E2E_CONSOLE_URL` | `http://localhost:3001` | Personnel console |
| `E2E_PORTAL_URL` | `http://localhost:3000` | Analytics portal |
| `E2E_AUTH_URL` | `http://localhost:9000` | Authorization server (sign-in form) |
| `E2E_ADMIN_USER` | `admin` | Administrator used by every test |
| `E2E_ADMIN_PASSWORD` | `Admin-Local-2026` | Its password |
| `E2E_HEADED` | unset | Set to `1` to show the browser windows |

## Layout

- `config/index.js`: URLs, credentials, window sizes and timeouts
- `support/`: driver factory with a fresh profile, explicit waits, screenshots on failure, unique test data names
- `pages/`: page objects (sign-in, app shell, data table, each page of the console and the portal)
- `test/console/`: console tests, including the role and tablet checks
- `test/portal/`: portal tests, including the viewer role and the phone layout

Tests that create data (users, products) remove it again in a `finally` block or in an `after` hook.

## Test list

Console, administrator:

1. Sign-in lands on the dashboard with the name, the role, the KPI cards, the monthly chart, the RFM segment
   cards and the latest ETL run.
2. A direct load of `/orders` stays on the page after the silent sign-in.
3. Every sidebar page opens with a centred title and there is no "return to homepage" control.
4. Users: sorting, the search box and create button positions, a validation error, creation, a duplicate
   username conflict, and deletion.
5. Products: catalog search and price sorting, create and delete, refusal to delete a product used in orders,
   smart search with facets, typeahead, and Turkish category labels.
6. Customers (warehouse filter, last-name search, balance sort, edit dialog), orders (warehouse and date filters,
   range error, order lines), warehouses (seeded list, create form validation).
7. ETL runs: runs listed, Start run button present, run details with steps and quality checks.
8. Segments: summary (seven segments), RFM heat grid (five rows), clusters table, Champions filter, Run
   segmentation button present.
9. Language: Turkish titles and navigation, remembered after a reload, back to English.
10. Tablet (768 x 1024): sidebar collapses, users table scrolls inside its card.

Console, roles (creates an analyst and a viewer account, then removes them):

11. Analyst: no Users entry, `/users` is refused, no create buttons on customers, products and warehouses, no
    Start run button.
12. Viewer: the no-access page with a sign-out button and no navigation.

Portal:

13. Sales dashboard: KPI cards, the revenue figure changes between "Last 30 days" and "All time", the trend
    granularity, the table view, top products and category bars, customer widgets for the administrator.
14. Product search: results, a category facet narrows the total, a price range, typeahead with arrow keys and
    Enter, Turkish category labels.
15. Viewer: the dashboard without the customer widgets, and only the portal pages in the navigation.
16. Phone (375 x 812): no sideways scrolling, the menu opens and closes, KPI cards in one column, the filters
    fold, interactive controls at least 44 px high.

## Known issues

None of the open items below is a test defect. They are reported with the test that shows them.

- The newest successful ETL run failed the quality check "EVERY CUSTOMER HAS ONE CURRENT ROW" (expected 300003,
  found 300000). The test "opens a successful run with its steps and quality checks all passing" opens that
  newest run and fails until the warehouse is loaded again from a consistent source.
- The warehouse list holds 13 rows: the ten seeded warehouses and three extra "North Ankara Central" rows that
  were not created by these tests. The test checks that the ten seeded ones come first.
