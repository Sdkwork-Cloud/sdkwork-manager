# Topology profiles

Manager uses the `application-http-gateway` archetype (`specs/topology.spec.json`).

## Connectivity planes

| Plane | Dev default | Routes |
| --- | --- | --- |
| Application public ingress | `http://127.0.0.1:18092` | `/app/v3/api/manager/*`, `/backend/v3/api/manager/*` |
| Platform API gateway | `http://127.0.0.1:3900` | IAM (`/app/v3/api/*`), other platform SDKs |

The standalone gateway (`pnpm start`) serves manager routes on the application ingress. IAM login requires the platform API gateway (or Vite dev proxy below).

## Local development

1. Start Postgres and run migrations: `pnpm db:bootstrap`
2. Start manager API: `pnpm start` (bind `127.0.0.1:18092`)
3. Start platform API gateway on `127.0.0.1:3900` (sibling `sdkwork-api-cloud-gateway` workspace) for IAM login
4. Start PC shell: `pnpm dev` (Vite `127.0.0.1:5190`)

### Vite dev proxy

PC (`5190`) enables `buildManagerViteDevProxy()` so browser SDK clients use same-origin relative URLs:

- `/app/v3/api/manager` and `/backend/v3/api/manager` → application ingress (`18092`)
- `/app/v3/api` and `/backend/v3/api` (other paths) → platform gateway (`3900`)

Set `VITE_SDKWORK_MANAGER_VITE_DEV_PROXY_ENABLED=false` to call absolute topology URLs instead.

### Database environment

Development profile uses `MANAGER_DATABASE_*` keys (see `standalone.unified-process.development.env`), aligned with `sdkwork-manager-database-host` (`DatabaseConfig::from_env("MANAGER")`).

## Profile files

| Profile | File |
| --- | --- |
| standalone.unified-process.development | `standalone.unified-process.development.env` |
| cloud.split-services.production | `cloud.split-services.production.env` |
