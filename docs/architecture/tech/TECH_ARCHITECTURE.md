# Manager Technical Architecture

Status: active
Owner: SDKWork maintainers
Updated: 2026-07-18
Specs: `sdkwork-specs/ARCHITECTURE_DECISION_SPEC.md`, `APP_PC_ARCHITECTURE_SPEC.md`, `WEB_FRAMEWORK_SPEC.md`, `DATABASE_FRAMEWORK_SPEC.md`

## 1. Architecture Overview

`sdkwork-manager` is the platform manager capability application. It provides
the integration host and platform-manager backend capability, persists its own
state in PostgreSQL via `sdkwork-database`, and delivers a PC React unified
admin host under `apps/sdkwork-manager-pc/`. The PC host composes business admin
modules from their owning application workspaces instead of absorbing their
implementation.

Detailed PC integration and commercialization design:
[TECH-unified-admin-host.md](TECH-unified-admin-host.md).

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
- `apps/sdkwork-manager-pc/`: PC browser unified admin host, IAM/bootstrap
  wiring, module registry, Header composition, and route assembly

## 4. API, SDK, And Data Ownership

- App API prefix: `/app/v3/api/manager`
- Backend API prefix: `/backend/v3/api/manager`
- Success envelope: `SdkWorkApiResponse` with numeric `code: 0`, `data`, `traceId`
- Errors: `application/problem+json` (`ProblemDetail`)
- Table prefix: `platform_` (schema owner: `manager-platform`)
- Database env prefix: `MANAGER_DATABASE_*` (runtime) / topology `SDKWORK_MANAGER_*`
- File and storage administration: composed `sdkwork-drive` backend/admin-storage SDKs through the platform gateway
- Commercial operations: composed Order, Promotion, Payment, and Membership backend SDKs through the platform gateway
- Operator mutation visibility: owning Payment and Order admin workspaces expose
  explicit capability props; Manager maps them from the IAM permission scope
  using the same OpenAPI permission codes enforced by backend routes
- Commercial module entitlement: Manager owns the tenant-application authority
  in `platform_manager_entitlement_snapshot` and
  `platform_manager_entitlement_grant`. The composed Manager Backend SDK reads
  the versioned snapshot for PC visibility and exposes the protected
  `/commercial_entitlements/verify` command for trusted gateway/business-service
  enforcement. It remains separate from end-user Membership benefit accounts.
- Commercial authorization permissions are split by responsibility:
  `manager.entitlements.read` is available to the Manager PC session,
  `manager.entitlements.manage` belongs only to the licensing/control-plane
  identity, and `manager.entitlements.enforce` belongs only to trusted
  server-side consumers. Browser visibility never replaces the verify command.
- Customer 360: IAM user directory as the entry point, with permission-gated
  Membership reads; no Manager-owned customer master table and no browser
  full-list cross-domain join
- Service discovery: deferred until RPC/cloud-split deployment exists

## 5. Deployment And Runtime Topology

- Topology authority: `specs/topology.spec.json` (`appId: sdkwork-manager`)
- Deploy authority: `deployments/deploy.yaml`
- Profiles: standalone unified-process (dev) and cloud split-services (prod)
- Gateway configs: `etc/sdkwork-api-cloud-gateway.manager.{profile}.toml`
- Platform ingress embeds the `manager-operations-suite` feature: Drive,
  Membership, Order, Promotion, and Payment gateway assemblies, each with its domain-owned
  database lifecycle and IAM request-context enforcement.

## 5.1 Customer And Membership Request Flow

```text
Customer/Membership page
  -> Manager admin-core provider
  -> @sdkwork/iam-service or @sdkwork/membership-service
  -> composed backend SDK
  -> platform API gateway embedded router
  -> domain route/service/repository
```

All clients share the Manager operator `TokenManager`. The UI does not construct
SDK clients, URLs, authorization headers, or local DTO forks. Membership member
detail and status updates enforce tenant and organization scope in PostgreSQL
and SQLite repositories. The generated Membership backend SDK excludes the
service-only purchase fulfillment operation.

## 5.2 Commercial Entitlement Request Flow

```text
Manager protected shell
  -> injected admin-core loader
  -> @sdkwork/manager-backend-sdk
  -> GET /backend/v3/api/manager/commercial_entitlements/current
  -> tenant + session app snapshot
  -> module registry visibility projection

Trusted Payment/Order/Promotion/Membership/Drive service or gateway policy
  -> generated sdkwork-manager-backend-sdk Rust transport
  -> POST /backend/v3/api/manager/commercial_entitlements/verify
  -> tenant-bound allowed/reason/version decision
  -> execute or reject the paid operation
```

The platform API gateway's current policy chain is static and does not yet own
an asynchronous external entitlement adapter. Until that adapter or equivalent
domain-service enforcement is deployed, production paid command cutover remains
blocked even though the authority, TypeScript/Rust SDKs, and fail-closed browser
projection are implemented. The Rust transport is generated from the same
Manager Backend API authority and exposes `commercial_entitlements_verify`; it
must receive short-lived, tenant-bound service-account dual-token credentials
from an approved IAM workload identity flow. IAM currently owns service-account
directory and RBAC records but does not expose that client-credentials/token
exchange flow. Super-admin bootstrap credentials, static service tokens, and
forwarded operator tokens are forbidden substitutes.

## 6. Verification

```bash
pnpm verify
pnpm build
pnpm deploy:validate
pnpm topology:validate
pnpm gateway:validate:cloud
node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace ..
```
