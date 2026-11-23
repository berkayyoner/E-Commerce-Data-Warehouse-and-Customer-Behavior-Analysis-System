# Shop Service

Spring Boot service (Java 21) that exposes the OLTP shop schema (`dwh_oltp`) as a REST API: products, warehouses,
customers and orders. It uses Spring Data JPA with Hibernate on Oracle and does not create or alter any table.

## Security

The service is an OAuth 2.0 resource server. Every request to `/api/shop/**` needs a bearer access token from the
auth service. The token must carry a `roles` claim; each role becomes an authority `ROLE_<name>`.

| Method | Path | Roles |
|---|---|---|
| GET | `/api/shop/**` | `ADMIN`, `ANALYST`, `VIEWER` |
| POST, PUT, DELETE | `/api/shop/**` | `ADMIN` |
| GET | `/actuator/health/**`, `/actuator/info` | public |

The JWT decoder is built from the issuer location without contacting the auth service at startup, so the service
starts while the auth service is down.

## REST API

All lists take `search`, `sort`, `direction` (`asc` or `desc`), `page` (0 based) and `size` (1 to 100, default 20)
and answer `{"content": [...], "total": n, "page": p, "size": s}`. An unknown `sort` value uses the default sort.
Errors are `application/problem+json`: `404` for unknown keys, `409` for conflicts, `400` with the list of invalid
fields for validation errors.

| Method | Path | Description |
|---|---|---|
| GET | `/api/shop/products` | Products. Search over name, category and brand. Sort: `id`, `name`, `category`, `brand`, `price` |
| GET | `/api/shop/products/{id}` | One product |
| POST | `/api/shop/products` | Creates a product (id from `SEQ_ITEM_ID`). Answers `201` with `Location` |
| PUT | `/api/shop/products/{id}` | Replaces name, price, category and brand |
| DELETE | `/api/shop/products/{id}` | Deletes a product. `409` when an order line refers to it |
| GET | `/api/shop/warehouses` | Warehouses. Search over name, city and region. Sort: `id`, `name`, `city`, `region` |
| GET | `/api/shop/warehouses/{id}` | One warehouse |
| POST | `/api/shop/warehouses` | Creates a warehouse (id from `SEQ_WAREHOUSE_ID`). Answers `201` with `Location` |
| PUT | `/api/shop/warehouses/{id}` | Replaces name, city and region |
| DELETE | `/api/shop/warehouses/{id}` | Deletes a warehouse. `409` when it has customers or orders |
| GET | `/api/shop/customers` | Customers. Optional `warehouseId`. Search over names, email, city and region. Sort: `id`, `firstName`, `lastName`, `city`, `region`, `since`, `balance` |
| GET | `/api/shop/customers/{warehouseId}/{districtId}/{customerId}` | One customer |
| POST | `/api/shop/customers` | Creates a customer. The number is the highest one in the district plus one. Answers `201` with `Location` |
| PUT | `/api/shop/customers/{warehouseId}/{districtId}/{customerId}` | Replaces first name, last name, email, city and region |
| GET | `/api/shop/orders` | Orders (read only). Optional `warehouseId`, `from` and `to` (ISO dates, both inclusive). Search over customer names. Sort: `orderDate` (default, `desc`), `totalAmount`, `lineCount`, `customerName`, `orderId` |
| GET | `/api/shop/orders/{warehouseId}/{districtId}/{orderId}` | One order with its lines, product names and the total |

Order totals are computed in the list query with a correlated sum over the lines of each order on the requested page.
Sorting by `totalAmount` has to evaluate that sum for every matching order.

A Postman collection is in `postman/`. Set the `token` variable to an access token before running it.

## Configuration

| Variable | Default (local profile) | Meaning |
|---|---|---|
| `OLTP_DB_USERNAME` | `dwh_oltp` | Database account |
| `OLTP_DB_PASSWORD` | none | Password of the database account |
| `DB_HOST`, `DB_PORT`, `DB_SERVICE` | `localhost`, `1521`, `FREEPDB1` | Oracle connection |
| `AUTH_ISSUER` | `http://localhost:9000` | Issuer of the access tokens (`spring.security.oauth2.resourceserver.jwt.issuer-uri`) |
| `SHOP_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Browser origins allowed by CORS |

Profiles: `local` (default), `development`, `production`. The production profile has no fallback values.

## Run it

```bash
mvn -pl services/shop-service package
OLTP_DB_PASSWORD=... java -jar services/shop-service/target/shop-service-0.1.0-SNAPSHOT.jar
```

The service listens on port 8082.
