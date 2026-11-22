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

## How to get the project up
For createing all of the containers in your Docker application at once:
> CMD: `cd [project directory]` <br />
> CMD: `docker-compose up --build` <br />

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
