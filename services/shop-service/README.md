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
| GET | `/api/shop/search/products`, `/api/shop/search/suggest` | `ADMIN`, `ANALYST`, `VIEWER` |
| POST | `/api/shop/search/reindex` | `ADMIN` |
| GET | `/api/shop/search/reindex` | `ADMIN`, `ANALYST` |
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

### Product search (Elasticsearch)

| Method | Path | Description |
|---|---|---|
| GET | `/api/shop/search/products` | Full text search with facets. Parameters: `q`, `lang` (`en` or `tr`), `category` (comma separated), `brand`, `minPrice`, `maxPrice`, `sort` (`relevance`, `priceAsc`, `priceDesc`, `nameAsc`), `page`, `size` (1 to 100, default 20) |
| GET | `/api/shop/search/suggest` | Up to 8 suggestions `{text, type}` with `type` `PRODUCT`, `CATEGORY` or `BRAND`. Parameters: `q` (at least 2 characters, otherwise empty), `lang`, `size` |
| POST | `/api/shop/search/reindex` | Starts a full rebuild of the index in the background. Answers `202` with the status. `409` while a rebuild is running |
| GET | `/api/shop/search/reindex` | Status of the last rebuild: `state` (`IDLE`, `RUNNING`, `SUCCESS`, `FAILED`), `indexed`, `total`, `startedAt`, `finishedAt`, `message` |

A search answers `{"content": [...], "total": n, "page": p, "size": s, "facets": {...}}`. Each hit has `id`, `name`,
`price`, `category`, `categoryLabel` (the Turkish name when `lang=tr`), `brand` and `score`. The facets are
`categories` and `brands` (term counts, at most 20 each) and `price` (`min` and `max` of the matching products).

Invalid values (unknown `lang` or `sort`, negative `page`, `minPrice` above `maxPrice`, a page past the first 10000
hits) answer `400`. When Elasticsearch cannot be reached or the index is missing, the search endpoints answer `503`.

**Index design.** The search reads the alias `shop-products`. The alias points at a physical index named
`shop-products-v{timestamp}`. A reindex writes a new version, moves the alias and deletes the old version, so the
search never sees a half built index. The mapping of each field:

| Field | Mapping |
|---|---|
| `id` | long, also the document id |
| `name` | text, `english` analyzer. Subfields: `prefix` (edge n-grams of 2 to 15 characters, used for typeahead) and `raw` (keyword, used for sorting) |
| `category` | keyword with a `text` subfield (`english` analyzer) |
| `categoryTr` | text with the `product_turkish` analyzer (lowercase with Turkish rules, ASCII folding, Turkish stemmer), subfield `raw` |
| `brand` | keyword with a lowercase normalizer, subfield `text` (`english` analyzer) |
| `price` | scaled float with a factor of 100 |
| `indexedAt` | date |

**Turkish and English.** Each category is stored in English. `CategoryNames` holds the Turkish name of each category
in one place (for example `Toys and Games` is `Oyuncak ve Oyun`). The Turkish name is indexed in `categoryTr`, so a
query such as `cocuk` or `kozmetik ve bakim` finds the Turkish category without the diacritics. With `lang=tr` the
Turkish category field gets boost 3 and the hits carry the Turkish label. With `lang=en` it gets boost 1. Unknown
categories keep their English name.

**Query.** A blank `q` matches everything. Otherwise a bool query has a `multi_match` over `name^3`, `name.prefix^2`,
`category.text`, `categoryTr` and `brand.text`, and for queries of 4 or more characters an extra fuzzy match on `name`
(`fuzziness: AUTO`). Filters (category, brand, price range) run in filter context and do not affect scores.

**Keeping the index current.** A product change publishes an application event. A listener runs after the transaction
commits and indexes or removes the document, so a rolled back change never reaches the index. A failure to reach
Elasticsearch is logged and the product call still succeeds. Such a change is missed by the index until the next reindex.

**Reindex.** A reindex reads the products in pages of 2000 and bulk loads them into the new version. Only one reindex
runs at a time, on a single background worker. At startup the service creates the alias and starts a reindex when the
alias is missing, or when the alias is empty while the product table is not. Changes made while a reindex runs reach
the previous version only, so run a reindex again after heavy changes during a rebuild.

Elasticsearch 9.x is expected at `ELASTICSEARCH_URIS`. The service uses the Java API client that Spring Boot configures
from `spring.elasticsearch.*`.

A Postman collection is in `postman/`. Set the `token` variable to an access token before running it.

## Configuration

| Variable | Default (local profile) | Meaning |
|---|---|---|
| `OLTP_DB_USERNAME` | `dwh_oltp` | Database account |
| `OLTP_DB_PASSWORD` | none | Password of the database account |
| `DB_HOST`, `DB_PORT`, `DB_SERVICE` | `localhost`, `1521`, `FREEPDB1` | Oracle connection |
| `AUTH_ISSUER` | `http://localhost:9000` | Issuer of the access tokens (`spring.security.oauth2.resourceserver.jwt.issuer-uri`) |
| `SHOP_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Browser origins allowed by CORS |
| `ELASTICSEARCH_URIS` | `http://localhost:9200` | Elasticsearch address (`spring.elasticsearch.uris`) |
| `ELASTICSEARCH_USERNAME`, `ELASTICSEARCH_PASSWORD` | empty | Optional credentials of Elasticsearch |

Profiles: `local` (default), `development`, `production`. The production profile has no fallback values.

## Run it

```bash
mvn -pl services/shop-service package
OLTP_DB_PASSWORD=... java -jar services/shop-service/target/shop-service-0.1.0-SNAPSHOT.jar
```

The service listens on port 8082.
