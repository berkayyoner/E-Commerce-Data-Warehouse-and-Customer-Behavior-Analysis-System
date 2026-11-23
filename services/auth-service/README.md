# Auth Service

OAuth 2.0 / OpenID Connect authorization server (Spring Authorization Server) and user management API.

## Clients

| Client id | Type | Grants | Scopes |
|---|---|---|---|
| `analytics-portal` | Public React app | Authorization code with PKCE | `openid profile dwh.read` |
| `dwh-admin` | Public React app (personnel) | Authorization code with PKCE | `openid profile dwh.read dwh.write` |
| `api-test` | Public client for Postman (registered only when `AUTH_API_TEST_REDIRECT_URIS` is set; the local profile sets it) | Authorization code with PKCE | `openid profile dwh.read dwh.write` |
| `etl-scheduler` | Service (secret) | Client credentials | `etl.run` |

Access tokens live 15 minutes. Spring Authorization Server issues no refresh tokens to public clients, so the React apps sign in again silently when a token expires: the redirect to the server is answered at once while the server session is alive. The access token carries a `roles` claim
(`ADMIN`, `ANALYST` or `VIEWER`) that the other services use for authorization.

## Endpoints

| Path | Description |
|---|---|
| `/.well-known/openid-configuration`, `/oauth2/authorize`, `/oauth2/token`, `/oauth2/jwks` | OAuth 2.0 and OpenID Connect |
| `GET /api/auth/me` | The signed in user and roles |
| `GET /api/auth/users?search=&sort=&direction=&page=&size=` | Users table (admin only) |
| `POST /api/auth/users`, `PUT /api/auth/users/{id}`, `DELETE /api/auth/users/{id}` | Manage users (admin only) |

The last active administrator cannot be demoted, disabled or deleted, and nobody can disable or delete their own
account.

## Configuration

| Variable | Meaning |
|---|---|
| `APP_DB_PASSWORD` | Password of the `dwh_app` account that owns `app_user` |
| `AUTH_ISSUER` | Public address of this server (default `http://localhost:9000`) |
| `AUTH_ALLOWED_ORIGINS` | Browser origins of the React apps (CORS) |
| `AUTH_ANALYTICS_REDIRECT_URIS`, `AUTH_ADMIN_REDIRECT_URIS` | Redirect addresses after sign in |
| `AUTH_API_TEST_REDIRECT_URIS` | Callback address of the `api-test` client; leave empty in production |
| `AUTH_ETL_CLIENT_SECRET` | Secret of the `etl-scheduler` client; the client is not registered when empty |
| `AUTH_JWT_PRIVATE_KEY`, `AUTH_JWT_PUBLIC_KEY` | Base64 PKCS8 / X509 RSA key pair. A temporary key is generated when empty (local only) |
| `AUTH_ADMIN_USERNAME`, `AUTH_ADMIN_PASSWORD` | First administrator, created when the user table is empty |

Profiles: `local` (default), `development`, `production`. Production has no fallback values.

The user table is created by `database/app/01_app_tables.sql`.
