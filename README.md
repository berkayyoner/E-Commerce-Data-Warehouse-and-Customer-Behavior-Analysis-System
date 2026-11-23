# E-Commerce Data Warehouse and Customer Behavior Analysis System

This project is being developed as a term project for the Information Technologies track within the Computer Engineering department at Yıldız Technical University for the year 2026.

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
* **Deployment:** GitLab
* **Front-end Test Tools:** Selenium
* **Back-end Test Tools:** Unit Test, Postman
* **Authentication:** OAuth 2.0

## What the system does
Shop orders are generated as an OLTP database (TPC-C through BenchBase) and turned into e-commerce data. An ETL process
loads them into a star schema, reports and customer segments (RFM and K-Means) are served by microservices, and two React
applications show the results: a public analytics portal and a personnel console.

## Project structure
| Folder | Content |
|---|---|
| `services/` | Spring Boot services: `auth-service` (OAuth 2.0), `etl-service`, `shop-service`, `analytics-service`, `segmentation-service` |
| `web/` | React applications: `dwh-admin-web` (personnel console), `analytics-portal-web` (public portal) |
| `database/` | Oracle accounts, BenchBase configuration, data enrichment, Flyway migrations, reconciliation test |
| `deploy/` | API gateway configuration, Kubernetes manifests, deployment notes |
| `e2e-tests/` | Selenium browser tests |
| `postman/` | Postman environments (the collections are in each service) |
| `docs/` | Report, star schema, database operations, testing, demo script |
| `scripts/` | Start and stop the whole system on a developer machine |

## Quick start (Windows, Docker Desktop, Java 21, Node 22)
> PowerShell: `Copy-Item .env.example .env` (then choose the passwords) <br />
> PowerShell: `docker compose up -d oracle-db redis elasticsearch` <br />
> PowerShell: `.\database\scripts\migrate-database.ps1 -Schema olap` and `-Schema app` (first start of a new database) <br />
> PowerShell: `.\scripts\start-local.ps1 -Build` (services and both web apps) <br />
> Open http://localhost:3000 (portal) or http://localhost:3001 (console) <br />

The data is generated and loaded as described in `database/README.md`; the full report is in `docs/report.md`.

## How to get the project up
For creating all of the containers in your Docker application at once (database, cache, search and every service):
> CMD: `cd [project directory]` <br />
> CMD: `docker compose --profile apps up -d --build` <br />

## How to get project builds
> CMD: `cd [project directory]` <br />
> CMD: `mvnv` <br />

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
