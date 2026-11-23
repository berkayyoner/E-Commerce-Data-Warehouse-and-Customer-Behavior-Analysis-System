# Deployment

## Images

Every service and both web apps have a Dockerfile (multi-stage: build, then a small runtime image running as a non-root
user). Build the service images from the repository root, the web images from their folder:

```bash
docker build -f services/etl-service/Dockerfile -t dwh/etl-service .
docker build -t dwh/dwh-admin-web web/dwh-admin-web
```

## Everything in containers on one machine

```bash
docker compose up -d oracle-db redis elasticsearch      # infrastructure
docker compose --profile apps up -d --build              # services and web apps
```

The services reach the auth server through `host.docker.internal:9000`, the same address the token issuer carries,
so this works on Docker Desktop. The optional profile `gateway` adds an nginx entry point on port 8080 that routes by
path (`deploy/gateway/default.conf`).

## Kubernetes

`deploy/k8s` is a kustomize project:

| Folder | Content |
|---|---|
| `base/` | Deployments and services of the five services and both web apps, config maps, ingress (three host names: portal, console, API), autoscalers for the shop and report services, the nightly incremental ETL job |
| `infrastructure/` | Single node Redis and Elasticsearch for development clusters (production uses managed services) |
| `overlays/development` | Namespace `dwh-development`, one replica, `development` Spring profile, development host names, Redis and Elasticsearch |
| `overlays/production` | Namespace `dwh-production`, two replicas for auth, shop, reports and web apps, anti-affinity and a disruption budget for the auth service |

Render or apply an environment:

```bash
kubectl kustomize deploy/k8s/overlays/development          # look at the result
kubectl apply -k deploy/k8s/overlays/development
```

Oracle runs outside the cluster. Before the first deployment of an environment:

1. Create the namespace (`kubectl create namespace dwh-development`).
2. Create the secret `dwh-secrets` (template: `deploy/k8s/secrets.example.yaml`) from your secret store.
3. Create the TLS secret `dwh-tls` for the three host names, or let cert-manager create it.
4. Replace the example host names in `base/config.yaml`, `base/ingress.yaml` and the overlays.
5. Run the database migrations (`docker compose --profile migrate run --rm flyway-olap`, or the pipeline job).
6. After the first deployment: create the first administrator through `AUTH_ADMIN_PASSWORD`, run a full ETL
   (`POST /api/etl/runs` with `FULL`) and a segmentation run. The nightly job keeps the warehouse current afterwards.

The services use the `production` or `development` Spring profile, which has no fallback values: a missing setting stops
the pod from starting, which the readiness probe makes visible.

## GitLab pipeline

`.gitlab-ci.yml`: unit tests of all services and both web apps, then image builds (Kaniko, no Docker daemon), Flyway
migrations and the deployment. Development is deployed automatically from the default branch; the same images are
promoted to production with a manual approval, after the manual production migration.

CI/CD variables (Settings, CI/CD, Variables; mask and protect the secrets):

| Variable | Used by |
|---|---|
| `KUBE_CONFIG` (file) | deploy jobs: kubeconfig of the cluster (one per environment scope) |
| `DB_HOST`, `DB_PORT`, `DB_SERVICE` | migration jobs |
| `OLAP_PASSWORD`, `APP_DB_PASSWORD` | migration jobs |

The container registry variables (`CI_REGISTRY*`) are provided by GitLab. Nothing is pushed by hand: the pipeline is the
only way images and manifests reach the clusters.
