# Shop Data Warehouse - Personnel Console

The web console for the personnel of the shop data warehouse. It is a React single-page application that
talks to the auth, ETL, analytics and segmentation services.

## Features

- **Dashboard** (administrators and analysts): key figures, monthly revenue (chart or table), revenue by
  category, RFM customer segments and the latest ETL run. Every widget loads on its own and has its own error
  state with a retry button.
- **ETL runs** (administrators and analysts): newest-first list with search, sorting and mm:ss durations. Run
  details show the steps and the quality checks. Administrators start Full or Incremental runs. A running run
  refreshes the list every 5 seconds while the tab is visible.
- **Personnel accounts** (administrators only): search, sorting, create, edit (password optional) and delete.
- **Customers**: the shop customers by warehouse-district-customer key, with search, a warehouse filter, sorting,
  create and edit. Customers are never deleted.
- **Products**: the catalog from the database (search, sorting, create, edit, delete; a product that is in orders
  cannot be deleted) and the smart search over the Elasticsearch index: typeahead with keyboard support, category
  and brand facets, a price range, sorting and paged results. Administrators can rebuild the search index and watch
  its progress.
- **Warehouses**: the shop warehouses with tax and year-to-date sales, searchable and sortable, with create, edit and
  delete (a warehouse that still has customers or orders cannot be deleted).
- **Orders** (read only): orders with a customer search, a warehouse filter and an order date range. A row opens the
  order header and its lines.
- **Segments**: the RFM segment summary and revenue per segment, a 5 by 5 RFM heat grid, the K-Means clusters with
  the elbow curve, and the customers with their scores, segment and cluster. Administrators start a segmentation run,
  which the page follows every three seconds until it finishes.
- English (default) and Turkish. The choice is remembered and sent as `Accept-Language`.

## Requirements

- Node.js 22 or newer and npm 10 or newer
- The back-end services (auth on port 9000, ETL on 8081, shop on 8082, analytics on 8083, segmentation on 8084 by
  default)

## Scripts

| Command | What it does |
| --- | --- |
| `npm install` | Installs the dependencies |
| `npm start` (or `npm run dev`) | Starts the development server on port 3001 |
| `npm test` | Runs the Jest test suite (use `npm test -- --watchAll=false` once) |
| `npm run build` | Creates the optimised production bundle in `build/` |

## Configuration

Build-time values are read from `.env.development`, `.env.production` or `.env.local` (copy `.env.example`).
At container start-up the values in `runtime-config.js` (written from the container environment) override them.

| Variable | Default | Purpose |
| --- | --- | --- |
| `REACT_APP_GATEWAY_URL` | empty | One address for every service behind a gateway. When set, the per-service values are ignored. |
| `REACT_APP_AUTH_URL` | `http://localhost:9000` | Auth service and OAuth 2.0 authorization server |
| `REACT_APP_ETL_URL` | `http://localhost:8081` | ETL service |
| `REACT_APP_SHOP_URL` | `http://localhost:8082` | Shop service: customers, products, warehouses, orders and search |
| `REACT_APP_ANALYTICS_URL` | `http://localhost:8083` | Analytics service |
| `REACT_APP_SEGMENTATION_URL` | `http://localhost:8084` | Segmentation service |
| `REACT_APP_DEFAULT_LANGUAGE` | `en` | Language used before the person chooses one (`en` or `tr`) |

In the Docker image the same addresses are set with the container variables `GATEWAY_URL`, `AUTH_URL`,
`ETL_URL`, `SHOP_URL`, `ANALYTICS_URL` and `SEGMENTATION_URL`. The Content-Security-Policy allows the browser to
call exactly those origins.

## Sign-in

The console uses the OAuth 2.0 authorization code flow with PKCE (S256) for the public client `dwh-admin`,
scopes `openid profile dwh.read dwh.write`, and the redirect URI `<origin>/callback`. The access token lives in
memory for 15 minutes. The refresh token is kept in `sessionStorage` for the browser tab. When a request gets a
401, the console refreshes the token once (concurrent requests share one refresh) and retries the request.

## Pages and roles

| Page | Path | ADMIN | ANALYST |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | yes | yes |
| Customers | `/customers` | list, create, edit | list |
| Products | `/products` | catalog: list, create, edit, delete; smart search: search and rebuild the index | catalog and smart search, read only |
| Warehouses | `/warehouses` | list, create, edit, delete | list |
| Orders | `/orders` | list and order detail (read only) | list and order detail |
| ETL runs | `/etl` | list, start a run | list |
| Segments | `/segments` | results, run segmentation | results |
| Personnel accounts | `/users` | list, create, edit, delete | no |

A VIEWER signs in but sees the "no console access" page. The menu and the buttons only show what the role may use.
Each route is also guarded, so a direct link to a page the role may not use shows the access denied page.

## Docker

```
docker build -t dwh-admin-web --build-arg REACT_APP_ETL_URL=https://etl.example.test .
docker run -p 8080:80 -e AUTH_URL=https://auth.example.test -e ETL_URL=https://etl.example.test dwh-admin-web
```

The image builds with a multi-stage Dockerfile and serves the bundle with nginx. nginx renders the
Content-Security-Policy and `runtime-config.js` from the container environment when it starts.

## Project layout

```
src/
  api/          HTTP clients per service, token store, resource calls
  auth/         PKCE, OAuth redirect and token exchange, roles, route guards
  components/   layout shell and reusable UI (data table, modal, form field, toasts, chart)
  config/       runtime and build-time configuration
  hooks/        translation, notifications, cached dashboard values, page visibility
  locales/      en and tr JSON files with identical keys
  navigation/   sidebar entries (route, icon, label key, allowed roles)
  pages/        sign-in, callback, dashboard, customers, products, warehouses, orders, ETL, segments and users pages
  store/        Redux Toolkit slices: auth, language, ui, cache
  styles/       layout, UI and page styles (design tokens live in index.css)
docker/         container start-up scripts
```
