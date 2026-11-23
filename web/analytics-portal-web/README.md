# Shop Analytics Portal

The public, responsive analytics portal of the shop data warehouse. Visitors who hold a portal role sign in and
read the sales dashboard and search the product catalogue. The application is a React single-page app that
talks to the auth service (OAuth 2.0), the analytics service and the shop service.

## Features

- **Dashboard** (`/`): one filter bar for the whole page (period presets, custom dates, category), key figures,
  a sales trend line chart with a granularity switch, top products (revenue or units), revenue by category,
  revenue by region and city, payment methods, and fulfillment. ADMIN and ANALYST also see customer metrics and a
  sortable table of the top customers.
- **Product search** (`/search`): a search field with a keyboard-operated typeahead, facets for categories and
  brands, a price range, sorting and pagination. Results are cards on phones and a table on desktop screens.
- English (default) and Turkish. The language switch sits in the navbar, the choice is remembered and it is sent as
  `Accept-Language`. The product search answers in the language of the page.
- Every chart has a summary for screen readers and a "Show as table" alternative. Every widget loads on its own and
  shows its own error with a retry button.

## Requirements

- Node.js 22 or newer and npm 10 or newer
- The back-end services: auth on port 9000, analytics on 8083, shop on 8082 (the defaults)

## Scripts

| Command | What it does |
| --- | --- |
| `npm install` | Installs the dependencies |
| `npm start` (or `npm run dev`) | Starts the development server on port 3000 |
| `npm test -- --watchAll=false` | Runs the Jest and Testing Library suite once |
| `npm run build` | Creates the optimised production bundle in `build/` |

## Configuration

Build-time values are read from `.env.development`, `.env.production` or `.env.local` (copy `.env.example`).
At container start-up the values in `public/runtime-config.js` (written from the container environment) override them.

| Variable | Default | Purpose |
| --- | --- | --- |
| `REACT_APP_GATEWAY_URL` | empty | One address for every service behind a gateway. When set, the per-service values are ignored. |
| `REACT_APP_AUTH_URL` | `http://localhost:9000` | Auth service and OAuth 2.0 authorization server |
| `REACT_APP_ANALYTICS_URL` | `http://localhost:8083` | Analytics service |
| `REACT_APP_SHOP_URL` | `http://localhost:8082` | Shop service (product search) |
| `REACT_APP_DEFAULT_LANGUAGE` | `en` | Language used before the person chooses one (`en` or `tr`) |

In the Docker image the same addresses are set with the container variables `GATEWAY_URL`, `AUTH_URL`,
`ANALYTICS_URL` and `SHOP_URL`. The Content-Security-Policy allows the browser to call exactly those origins.

## Sign-in and roles

The portal uses the OAuth 2.0 authorization code flow with PKCE (S256) for the public client `analytics-portal`,
scopes `openid profile dwh.read`, and the redirect URI `<origin>/callback`. The access token lives in memory for
15 minutes. The refresh token is kept in `sessionStorage` for the browser tab. When a request gets a 401, the portal
refreshes the token once (concurrent requests share one refresh) and retries the request. The name and roles of the
signed-in person come from `GET {auth}/api/auth/me`.

| Role | Dashboard | Product search | Customer widgets |
| --- | --- | --- | --- |
| ADMIN | yes | yes | yes |
| ANALYST | yes | yes | yes |
| VIEWER | yes | yes | no (the customer reports are not requested) |
| any other role | no (sees the "no portal access" page) | no | no |

## Docker

```
docker build -t analytics-portal-web --build-arg REACT_APP_ANALYTICS_URL=https://analytics.example.test .
docker run -p 8080:80 -e AUTH_URL=https://auth.example.test -e ANALYTICS_URL=https://analytics.example.test analytics-portal-web
```

The image builds with a multi-stage Dockerfile and serves the bundle with nginx. nginx renders the
Content-Security-Policy and `runtime-config.js` from the container environment when it starts.

## Project layout

```
src/
  api/          HTTP clients per service, token store, analytics and search calls
  auth/         PKCE, OAuth redirect and token exchange, roles, route guards
  components/   layout shell, charts (line chart, bar list, alternative table) and UI primitives
  config/       runtime and build-time configuration
  hooks/        translation, cached dashboard values, media queries
  locales/      en and tr JSON files with identical keys
  navigation/   navbar entries (route, icon, label key, allowed roles)
  pages/        sign-in, callback, access denied, dashboard widgets, product search
  store/        Redux Toolkit slices: auth, language, ui, cache
  styles/       layout, UI and page styles (design tokens live in index.css)
  utils/        number, currency and date formatting; date range presets
docker/         container start-up scripts
```

## Notes

- The analytics service has a category parameter only on the top products report. The category filter therefore
  narrows the top products list; the other reports cover every category, and the filter bar says so.
- Results of a report are reused for 60 seconds in the browser store, so moving between pages does not repeat the
  calls.
