# Manager Launch Readiness

Status: active
Owner: SDKWork maintainers
Updated: 2026-07-14

Pre-launch checklist for the commercial PC `backend-admin` host. This document
is release evidence guidance, not authorization to enable unapproved modules.

## 1. Repository verification

```bash
cd sdkwork-manager
pnpm install
pnpm --dir apps/sdkwork-manager-pc typecheck
pnpm --dir apps/sdkwork-manager-pc build
pnpm test:vitest
node ../sdkwork-specs/tools/check-app-sdk-consumer-imports.mjs --workspace .
node ../sdkwork-specs/tools/check-application-layering.mjs --workspace .
node ../sdkwork-specs/tools/check-tailwind-integration.mjs --root .
```

Run the repository `pnpm verify` gate in CI after the module-level commands
above. It includes contract checks, production PC build, cloud gateway bundle
validation, Rust clippy/tests, and API envelope alignment.

## 2. PC module smoke

```bash
pnpm start                    # manager-server on :18092
pnpm dev                      # PC shell on :5190 through the IAM dev bootstrap runner
curl http://127.0.0.1:18092/healthz
```

Sign in at `http://127.0.0.1:5190/auth/login`, then confirm:

- `/app/v3/api/system/iam/runtime` and
  `/app/v3/api/system/iam/verification_policy` return SDKWork success
  envelopes through the configured platform gateway;
- password, verification-code, registration, recovery, OAuth, QR login, and
  session bridge entries match the public IAM runtime policy without a
  Manager-local capability override;
- `/auth/register`, `/auth/forgot-password`, `/auth/oauth/callback/:provider`,
  and QR deep links remain inside the canonical IAM route surface;
- a valid dual-token session survives browser reload, propagates logout across
  tabs, and does not restore a persisted single-token payload;
- the global Header exposes only registered and permitted modules;
- selecting **Identity & Access** renders its module Header and its own Sidebar;
- the IAM Sidebar exposes only the routes allowed by the current session scope;
- users, tenants, organizations, authorization, OAuth, account binding, and
  audit deep links load their owning IAM package without an invalid React Hook
  runtime error;
- a disallowed deep link shows the host access-denied state; and
- logout invalidates the protected route and returns to `/auth/login`.

Do not replace `pnpm dev` with a direct `vite` command. The repository script
uses IAM's canonical renderer bootstrap runner to create a private,
manifest-scoped credential-entry token for local development only.

## 3. Environment and session safety

1. Start from `apps/sdkwork-manager-pc/.env.example` or the selected
   environment template. Tracked templates contain only public base URLs and
   non-secret IAM runtime choices.
2. Verify the selected profile uses `VITE_SDKWORK_MANAGER_APPLICATION_PUBLIC_HTTP_URL`
   for manager APIs and `VITE_SDKWORK_MANAGER_PLATFORM_API_GATEWAY_HTTP_URL`
   for IAM app/backend SDKs.
3. Confirm no `VITE_ACCESS_TOKEN`, `SDKWORK_ACCESS_TOKEN`, password, refresh
   token, or private key is present in tracked env files, manifests, build logs,
   or the static asset bundle.
4. Confirm the release records `deploymentProfile` (`standalone` or `cloud`),
   browser runtime target, public runtime config version, and CDN cache
   invalidation plan.

## 4. Module release gate

Every enabled contribution must provide all of the following evidence before it
is added to `src/bootstrap/adminModuleAssembly.ts`:

| Gate | Required evidence |
| --- | --- |
| Ownership | Module-local `component.spec.json`, `backend-admin` surface, owning domain and package version |
| Routing | Unique `/admin/...` prefix, route-collision test, declared default route, module Header and Sidebar metadata |
| SDK and auth | Composed backend SDK facade, shared TokenManager injection, no raw HTTP/manual headers, IAM permission mapping |
| Commercial | Entitlement key, tier, release channel, server-side entitlement enforcement, upgrade/support copy owner |
| Quality | Loading, empty, validation, error, and access-denied states tested by the owning module; typecheck and smoke result recorded |
| Release | Compatible backend/API version, rollback package version, feature-flag owner, operator runbook, release notes |

Commercial modules are fail-closed in the current host because an entitlement
provider is not yet wired. Do not manually add paid entitlement keys in browser
configuration or bypass the backend check.

## 5. Database lifecycle

```bash
pnpm db:validate
pnpm db:plan
pnpm db:migrate
pnpm db:status
```

## 6. IAM app bootstrap

Manifests are bootstrap-ready (`audit-app-manifest-bootstrap` reports 2 ready, 0 blocked).

When IAM backend is available from workspace root:

```bash
node bin/bootstrap-all-apps.mjs --filter sdkwork-manager --appbase-root sdkwork-iam --profile dev --dry-run
node bin/bootstrap-all-apps.mjs --filter sdkwork-manager --appbase-root sdkwork-iam --profile dev
```

The repository also exposes the canonical thin wrapper for a single Manager
manifest. Supply backend bootstrap credentials through the approved IAM
operator environment, never through a tracked env file:

```bash
pnpm admin:bootstrap:app -- --config sdkwork.app.config.json --domain manager.sdkwork.com
```

Note: workspace default runner path targets `sdkwork-appbase`; use `--appbase-root sdkwork-iam` until the workspace bootstrap entry is repointed.

For a production browser release, `SDKWORK_ACCESS_TOKEN` MUST NOT appear in a
`VITE_*` variable, public runtime config, HTML document, or static asset. The
Manager production build intentionally contains no credential-entry handoff.
Production credential-entry must be supplied by an IAM/gateway-attested
application context that resolves the registered tenant application from the
trusted deployment route. Do not release a browser deployment that substitutes
a long-lived bootstrap token for this platform capability.

## 7. Cloud packaging

```bash
pnpm gateway:package:cloud
pnpm gateway:validate:cloud
```

Artifact: `dist/cloud-config/sdkwork-manager-api-gateway-config-*.tar.gz`

## 8. Deferred until feature scope expands

| Item | Reason |
| --- | --- |
| `sdkwork-drive` | Required only when file upload ships (`DRIVE_SPEC.md`) |
| `sdkwork-discovery` | HTTP-only topology; no RPC split yet |
| Mobile `deploy.yaml` packages | PC web-only initial release; `packages: []` is valid |

## 9. Production cutover

1. Set production topology env (`configs/topology/cloud.split-services.production.env`)
2. Deploy `manager-server` binary and cloud gateway config bundle
3. Publish versioned PC static assets from `apps/sdkwork-manager-pc/dist/` and
   record checksum, CDN path, cache invalidation, and prior asset version
4. Execute IAM bootstrap for production tenant
5. Run the PC module smoke checklist and monitor `/healthz`, IAM session
   failures, authorization-denied rate, route-load errors, and API envelopes
   (`code: 0`, `traceId`)

## 10. Rollback

For a browser release, restore the previously recorded static asset version and
runtime public endpoint configuration, then invalidate only the affected CDN
paths. Roll back a contribution by removing its explicit assembly import or
releasing the recorded previous package version; do not delete domain data or
alter permission catalogs from the manager host. If a domain module introduced
a backend migration, follow that module's migration rollback or approved
forward-fix plan before restoring its UI package.
