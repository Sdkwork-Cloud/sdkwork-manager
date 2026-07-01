# Manager Technical Architecture

Status: active
Owner: SDKWork maintainers
Updated: 2026-06-30
Specs: `sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`, `WEB_FRAMEWORK_SPEC.md`, `DATABASE_FRAMEWORK_SPEC.md`

## 1. Architecture Overview

`sdkwork-manager` is the platform manager capability application. It exposes operator preferences and admin workflows through Rust HTTP route crates, persists state in PostgreSQL via `sdkwork-database`, and delivers a PC React admin shell under `apps/sdkwork-manager-pc/`.

## 2. Technology Choices

| Layer | Technology |
| --- | --- |
| HTTP runtime | Rust + Axum + `sdkwork-web-framework` |
| Persistence | PostgreSQL + `sdkwork-database` lifecycle |
| PC client | React + Vite + IAM auth runtime |
| Auth | `@sdkwork/auth-pc-react` + `auth-runtime-pc-react` + `TokenManager` |
| Contracts | OpenAPI 3.1.2 + generated TypeScript SDKs |
| Shared helpers | `@sdkwork/utils` / `sdkwork-utils-rust` |

## 3. System Boundaries And Modules

- `crates/sdkwork-routes-manager-*`: HTTP route boundaries (app-api, backend-api)
- `crates/sdkwork-platform-manager-service`: domain service
- `crates/sdkwork-manager-standalone-gateway`: unified process entrypoint
- `apps/sdkwork-manager-common/packages/sdkwork-manager-client-core/`: URL resolution, operator session storage, admin preference list helpers
- `apps/sdkwork-manager-pc/`: PC browser admin shell, IAM/bootstrap wiring, tenant preference admin panel

## 4. API, SDK, And Data Ownership

- App API prefix: `/app/v3/api/manager`
- Backend API prefix: `/backend/v3/api/manager`
- Success envelope: `SdkWorkApiResponse` with numeric `code: 0`, `data`, `traceId`
- Errors: `application/problem+json` (`ProblemDetail`)
- Table prefix: `platform_` (schema owner: `manager-platform`)
- Database env prefix: `MANAGER_DATABASE_*` (runtime) / topology `SDKWORK_MANAGER_*`
- File upload: not implemented; future work must use `sdkwork-drive` per `DRIVE_SPEC.md`
- Service discovery: deferred until RPC/cloud-split deployment exists

## 5. Deployment And Runtime Topology

- Topology authority: `specs/topology.spec.json` (`appId: sdkwork-manager`)
- Deploy authority: `deployments/deploy.yaml`
- Profiles: standalone unified-process (dev) and cloud split-services (prod)
- Gateway configs: `configs/sdkwork-api-cloud-gateway.manager.{profile}.toml`

## 6. Verification

```bash
pnpm verify
pnpm deploy:validate
pnpm topology:validate
node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace ..
```
