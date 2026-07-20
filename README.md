# sdkwork-manager
repository-kind: application

SDKWork **platform manager** capability application: unified PC manager admin console for operator workflows, preferences, and tenant administration.

- Standards: `../sdkwork-specs/README.md`
- Domain: `platform` / capability: `manager`
- PC app: `apps/sdkwork-manager-pc/`
- HTTP API: `crates/sdkwork-api-manager-standalone-gateway/`
- Database: `database/` via `sdkwork-database`

## Quick start

```bash
pnpm install
pnpm verify
pnpm build
pnpm --dir apps/sdkwork-manager-pc dev
```

## Framework integration

| Framework | Status | Notes |
| --- | --- | --- |
| `sdkwork-web-framework` | integrated | Request context + `SdkWorkApiResponse` / `ProblemDetail` via route common crate |
| `sdkwork-database` | integrated | `database/` lifecycle via `sdkwork-manager-database-host` |
| `sdkwork-utils` | integrated | `@sdkwork/utils` in manager-service and client-core |
| `sdkwork-drive` | not required yet | Integrate before adding file upload features |
| `sdkwork-discovery` | deferred | No RPC services yet |
| IAM login | integrated | PC shell uses `@sdkwork/auth-pc-react` + `auth-runtime-pc-react` |
| IAM app bootstrap | manifest-ready | `node bin/bootstrap-all-apps.mjs --filter sdkwork-manager --appbase-root sdkwork-iam --profile dev` |

## Operator surfaces

- **My preferences**: app SDK `manager.preferences.retrieve`
- **Tenant admin list**: backend SDK `manager.preferences.admin.list` via `PreferenceAdminPanel`

## Documentation Canon

- [docs/README.md](docs/README.md)
- [docs/product/prd/PRD.md](docs/product/prd/PRD.md)
- [docs/architecture/tech/TECH_ARCHITECTURE.md](docs/architecture/tech/TECH_ARCHITECTURE.md)
- [docs/runbooks/LAUNCH_READINESS.md](docs/runbooks/LAUNCH_READINESS.md)

## Application Roots

- [apps directory index](apps/README.md)
