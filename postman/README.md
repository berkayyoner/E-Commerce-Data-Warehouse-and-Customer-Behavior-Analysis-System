# Postman

Each service has a collection in `services/<name>/postman/`:

| Collection | Variable | Local address |
|---|---|---|
| ETL Service | `etlUrl` | http://localhost:8081 |
| Shop Service | `shopUrl` | http://localhost:8082 |
| Analytics Service | `analyticsUrl` | http://localhost:8083 |
| Segmentation Service | `segmentationUrl` | http://localhost:8084 |

The folder `environments/` holds one environment per stage (`local`, `development`, `production`) with the address of
every service and of the auth server. Behind the gateway all services share one address, so the development and
production files point every variable to the same host. Replace the example host names with the real ones.

## Signing in

All collections use the OAuth 2.0 settings of the collection itself (authorization code with PKCE, client id
`{{clientId}}`, callback `https://oauth.pstmn.io/v1/callback`):

1. Select the environment.
2. Open the collection, go to **Authorization** and press **Get New Access Token**.
3. Sign in on the page that opens (locally `admin` and the password given to the auth service at start) and press
   **Use Token**.

The client `api-test` is registered by the auth service only when `AUTH_API_TEST_REDIRECT_URIS` is set (the local
profile does it). Keep it disabled in production and use a dedicated test account on development.

The "without a token" requests switch authorization off on purpose and expect `401`.

## Running from the command line

```bash
npx newman run services/shop-service/postman/shop-service.postman_collection.json \
    -e postman/environments/local.postman_environment.json --global-var "token=<access token>"
```

`newman` cannot open the sign in page, so pass an access token with `--global-var` and change the collection
authorization to a bearer token for that run (or export the collection from Postman with the token set).

The ETL collection starts an incremental run and checks that a second request is refused while it is active; it does
not rebuild the warehouse. The segmentation collection starts a segmentation run.
