# Manager Launch Readiness

Status: active
Owner: SDKWork maintainers
Updated: 2026-06-30

Pre-launch checklist for `sdkwork-manager` (application not yet in production).

## 1. Repository verification

```bash
cd sdkwork-manager
pnpm install
pnpm verify
pnpm test
```

`pnpm verify` includes contract checks, production PC build, cloud gateway bundle validation, Rust clippy/tests, and API envelope alignment.

## 2. Local runtime smoke

```bash
pnpm start                    # manager-server on :18092
pnpm dev                      # PC shell on :5190
curl http://127.0.0.1:18092/healthz
```

Sign in at `http://127.0.0.1:5190/auth/login`, then confirm:

- My preferences load and save (`manager.preferences.retrieve` / `update`)
- Tenant admin list renders (`manager.preferences.admin.list`)

## 3. Database lifecycle

```bash
pnpm db:validate
pnpm db:plan
pnpm db:migrate
pnpm db:status
```

## 4. IAM app bootstrap

Manifests are bootstrap-ready (`audit-app-manifest-bootstrap` reports 2 ready, 0 blocked).

When IAM backend is available from workspace root:

```bash
node bin/bootstrap-all-apps.mjs --filter sdkwork-manager --appbase-root sdkwork-iam --profile dev --dry-run
node bin/bootstrap-all-apps.mjs --filter sdkwork-manager --appbase-root sdkwork-iam --profile dev
```

Note: workspace default runner path targets `sdkwork-appbase`; use `--appbase-root sdkwork-iam` until the workspace bootstrap entry is repointed.

## 5. Cloud packaging

```bash
pnpm gateway:package:cloud
pnpm gateway:validate:cloud
```

Artifact: `dist/cloud-config/sdkwork-manager-api-gateway-config-*.tar.gz`

## 6. Deferred until feature scope expands

| Item | Reason |
| --- | --- |
| `sdkwork-drive` | Required only when file upload ships (`DRIVE_SPEC.md`) |
| `sdkwork-discovery` | HTTP-only topology; no RPC split yet |
| Mobile `deploy.yaml` packages | PC web-only initial release; `packages: []` is valid |

## 7. Production cutover

1. Set production topology env (`configs/topology/cloud.split-services.production.env`)
2. Deploy `manager-server` binary and cloud gateway config bundle
3. Publish PC static assets from `apps/sdkwork-manager-pc/dist/`
4. Execute IAM bootstrap for production tenant
5. Monitor `/healthz` and preference API envelopes (`code: 0`, `traceId`)
