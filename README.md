# E-Commerce Data Warehouse and Customer Behavior Analysis System

This project is being developed as a term project for the Information Technologies track within the Computer Engineering department at Yıldız Technical University for the year 2026.

<img width="2541" height="1265" alt="image" src="https://github.com/user-attachments/assets/c8547d1e-7a18-44ca-a6f0-3568fa1f5265" />
<img width="2546" height="1266" alt="image" src="https://github.com/user-attachments/assets/82c12b19-a623-4ab5-afaf-18d75f7c59c0" />

## Technologies
* **Front-end:** React.Js
* **Front-end CRUD:** Axios
* **Front-end Caching:** Redux
* **Back-end:** Java Spring Boot (Java 21)
* **Back-end Dependancy and JVM:** Maven
* **Caching:** Redis
* **Containeriastion:** Docker
* **Product Search:** Elasticsearch
* **Environments for all projects:** development, production, local
* **ORM:** Hybernate with Spring JPA
* **Database:** Oracle
* **Server Management:** Kubernates
* **Deployment:** GitHub Actions
* **Front-end Test Tools:** Selenium
* **Back-end Test Tools:** Unit Test, Postman
* **Authentication:** OAuth 2.0

## What the system does
Shop orders are generated as an OLTP database (TPC-C through BenchBase) and turned into e-commerce data. An ETL process
loads them into a star schema, reports and customer segments (RFM and K-Means) are served by microservices, and one React
web application shows the results and gives access to the personnel tools.

## Project structure
| Folder | Content |
|---|---|
| `services/` | Spring Boot services: `auth-service` (OAuth 2.0), `etl-service`, `shop-service`, `analytics-service`, `segmentation-service` |
| `web/` | React web application `dwh-web` |
| `database/` | Oracle accounts, BenchBase load, data enrichment, Flyway migrations, reconciliation test |
| `deploy/` | API gateway configuration and Kubernetes manifests |
| `e2e-tests/` | Selenium browser tests |
| `postman/` | Postman environments (the collections are in each service) |
| `.github/workflows/` | CI: tests, images, deployment |
| `Veri-Ambari-Sunum.pptx` | Project presentation |

## Running the project
Docker Desktop is the only requirement.

```
docker compose up --build
```

The first start takes a while: the images are built, the TPC-C data is loaded and enriched, and the first ETL run and
customer segmentation are started. The applications are usable meanwhile; the reports fill when the `bootstrap`
container ends (follow it with `docker logs -f dwh-bootstrap`). Later starts take a minute or two.

| Address | What |
|---|---|
| http://localhost:3000 | Web app |
| http://localhost:9000 | Auth server |

Sign in with `admin` / `Admin-Local-2026`. The default passwords are for local use only; copy `.env.example` to `.env`
to choose others. `docker compose down -v` removes all data.

Tests: `mvn verify` (services), `npm test` in `web/dwh-web`, `npm test` in `e2e-tests` (needs the running system),
`newman` with the collections in `services/*/postman`.

## Oracle Container Backup & Migration (Docker -> Windows VDS)

There are two methods to back up and migrate your Oracle database container to a Windows VDS server. Choose one based on your database size and downtime tolerance.

### Backup

> PowerShell: `docker ps` <br />
> PowerShell: `docker stop sadecebesiktas-oracle` <br />
> PowerShell: `docker volume ls` <br />
> PowerShell: `
    $tarih = Get-Date -Format 'yyyy-MM-dd'
    docker run --rm `
    -v sadecebesiktas_oracle-data:/source:ro `
    -v C:\VDS_Backups:/backup `
    alpine tar czf "/backup/oracle_volume_$tarih.tar.gz" -C /source .
` <br />

### Clear Volume (Optional)

> PowerShell: `docker stop sadecebesiktas-oracle` <br />
> PowerShell: `docker run --rm -v sadecebesiktas_oracle-data:/target alpine sh -c "rm -rf /target/*"` <br />

### Migration

> PowerShell: `docker stop sadecebesiktas-oracle` <br />
> PowerShell: `docker run --rm -v sadecebesiktas_oracle-data:/target -v C:\VDS_Backups:/backup:ro alpine tar xzf /backup/oracle_volume_<tarih>.tar.gz -C /target` <br />
> PowerShell: `docker start sadecebesiktas-oracle` <br />

### Abort Git Merge

> PowerShell: `git merge --abort` <br />

### Git Merge (Auto Select)

> PowerShell: `git merge dev --strategy-option theirs` <br />
> PowerShell: Esc
> PowerShell: `:wq`
> PowerShell: Enter
