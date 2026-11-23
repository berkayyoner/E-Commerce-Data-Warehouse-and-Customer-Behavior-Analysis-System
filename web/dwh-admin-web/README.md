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
- English (default) and Turkish. The choice is remembered and sent as `Accept-Language`.

## Requirements

- Node.js 22 or newer and npm 10 or newer
- The back-end services (auth on port 9000, ETL on 8081, analytics on 8083, segmentation on 8084 by default)

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
| `REACT_APP_SHOP_URL` | `http://localhost:8082` | Shop service (reserved for later pages) |
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

## Roles

| Role | Dashboard | ETL runs | Start an ETL run | Personnel accounts |
| --- | --- | --- | --- | --- |
| ADMIN | yes | yes | yes | yes |
| ANALYST | yes | yes | no | no |
| VIEWER | no (sees the "no console access" page) | no | no | no |

The menu and the buttons only show what the role may use. Each route is also guarded, so a direct link to a
page the role may not use shows the access denied page.

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
  pages/        sign-in, callback, dashboard, users and ETL pages
  store/        Redux Toolkit slices: auth, language, ui, cache
  styles/       layout, UI and page styles (design tokens live in index.css)
docker/         container start-up scripts
```
