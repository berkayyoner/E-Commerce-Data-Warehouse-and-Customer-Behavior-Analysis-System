# Deployment

## Containers on one machine

`docker compose up --build` from the repository root starts everything, see the main README. The optional profile
`gateway` adds an nginx entry point on port 8080 that routes by path (`deploy/gateway/default.conf`):

```bash
docker compose --profile gateway up -d gateway
```

## Kubernetes

`deploy/k8s` is a kustomize project: `base/` holds the deployments, services, config maps, ingress, autoscalers and the
nightly ETL job; `infrastructure/` has a single node Redis and Elasticsearch for development clusters; `overlays/`
holds the development and production settings.

```bash
kubectl kustomize deploy/k8s/overlays/development
kubectl apply -k deploy/k8s/overlays/development
```

Oracle runs outside the cluster. Before the first deployment of an environment, create the namespace, the secret
`dwh-secrets` (template in `k8s/secrets.example.yaml`) and the TLS secret, and replace the example host names in
`base/config.yaml`, `base/ingress.yaml` and the overlays.

## GitHub Actions

`.github/workflows/ci.yml` runs the tests, builds the images into GitHub Container Registry on `main`, then migrates the
database and applies the manifests to development and production. Add required reviewers to the `production`
environment to make that step manual. Secrets: `KUBE_CONFIG` (base64 kubeconfig), `DB_HOST`, `DB_PORT`, `DB_SERVICE`,
`OLAP_PASSWORD`, `APP_DB_PASSWORD`. The image names in the manifests (`ghcr.io/your-github-user/dwh`) are replaced by the
workflow.
