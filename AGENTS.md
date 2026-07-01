# Repository Guidelines

<!-- SDKWORK-AGENTS-GENERATED: v2 -->

## SDKWORK Soul

Read `../sdkwork-specs/SOUL.md` before executing tasks in this root. Follow specs before memory, dictionary before context, stop on ambiguity, and evidence before completion.

## SDKWORK Standards

Canonical SDKWORK specs path from this root:

- `../sdkwork-specs/README.md`
- `../sdkwork-specs/SOUL.md`
- `../sdkwork-specs/AGENTS_SPEC.md`
- `../sdkwork-specs/PNPM_SCRIPT_SPEC.md`
- `../sdkwork-specs/WEB_FRAMEWORK_SPEC.md`
- `../sdkwork-specs/DATABASE_FRAMEWORK_SPEC.md`
- `../sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`
- `../sdkwork-specs/DRIVE_SPEC.md`

Do not copy root standard text into this repository. If these relative paths do not resolve, stop and report the broken workspace layout.

## Application Identity

Read `sdkwork.app.config.json` and `apps/sdkwork-manager-pc/sdkwork.app.config.json` when changing manager application behavior, runtime config, SDK wiring, release metadata, or owned capabilities.

## Local Dictionary Structure

- `AGENTS.md`: repository agent entrypoint and relative SDKWork spec index.
- `sdkwork.app.config.json`: repository-root application manifest for IAM bootstrap and release metadata.
- `apps/sdkwork-manager-pc/sdkwork.app.config.json`: PC surface manifest for browser/desktop delivery.
- `.sdkwork/`: local skills, plugins, manifests, and AI workspace metadata.
- `specs/`: local application/component contracts and narrowing rules.
- `apis/`: authored API contracts for platform manager capability.
- `apps/sdkwork-manager-pc/`: PC browser/desktop manager admin application root.
- `apps/sdkwork-manager-common/packages/`: shared TypeScript contracts, client-core (URL/session), and service normalization.
- `crates/`: Rust crates including `sdkwork-routes-manager-*` route crates.
- `database/`: `sdkwork-database` lifecycle assets.
- `sdks/`: SDK family workspaces and generated artifacts.
- `configs/`, `deployments/`, `scripts/`, `tools/`, `docs/`, `tests/`: config templates, deployment descriptors, validators, documentation, and verification assets.
- `package.json`, `Cargo.toml`: language/build manifests.

## Project Rules

- Canonical domain: `platform`; capability: `manager` (`DOMAIN_SPEC.md`).
- Database table prefix: `platform_` for manager-owned tables.
- App API prefix: `/app/v3/api/manager`.
- Backend API prefix: `/backend/v3/api/manager`.
- Rust HTTP runtimes integrate `sdkwork-web-framework`; database lifecycle uses `sdkwork-database`.
- TypeScript packages consume `@sdkwork/utils` for shared helpers — no local duplicates.
- PC admin shell uses `@sdkwork/auth-pc-react` + `@sdkwork/auth-runtime-pc-react` with `TokenManager` via `@sdkwork/sdk-common`.
- Generated SDK clients: `sdkwork-manager-app-sdk`, `sdkwork-manager-backend-sdk` — no raw HTTP in UI packages.
- File uploads `MUST` use `sdkwork-drive` SDK or server uploader before any upload feature ships.
- `sdkwork-discovery` is deferred until RPC/cloud-split deployment exists.
- Generated SDK output under `sdks/**/generated/**` is generator-owned.

## Verification

```bash
pnpm verify
pnpm db:validate
node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace ..
```

## Documentation Canon

- [docs/README.md](docs/README.md)
- [docs/product/prd/PRD.md](docs/product/prd/PRD.md)
- [docs/architecture/tech/TECH_ARCHITECTURE.md](docs/architecture/tech/TECH_ARCHITECTURE.md)

## HTTP API Response Envelope

All L2+ `app-api`, `backend-api`, and SDKWork-owned business `open-api` HTTP contracts `MUST` follow `API_SPEC.md` section 4.5, section 14, and section 15:

- **Input:** typed request bodies, section 14.1 list/search/command input, `SdkWorkListQuery`, and `q` for free-text search.
- **Success output:** `SdkWorkApiResponse` with `{ "code": 0, "data": <payload>, "traceId": "<server-uuid>" }`.
- **Error output:** HTTP 4xx/5xx `application/problem+json` (`ProblemDetail`) with numeric `code` and `traceId`.

Handlers `MUST` serialize success and map errors through `sdkwork-web-framework` response mapping.

Before completing API contract, SDK generation, or frontend service work, run:

```bash
node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace ..
```

Authority: `sdkwork-specs/API_SPEC.md` section 4.5 and sections 14–16, `SDK_SPEC.md` section 4.2, `FRONTEND_SPEC.md`, `MIGRATION_SPEC.md` section 4.2.
