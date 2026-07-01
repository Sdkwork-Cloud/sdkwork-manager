# SDKWork Manager PC PRD

Status: active
Owner: SDKWork maintainers
Application: sdkwork-manager-pc
Updated: 2026-06-30
Specs: REQUIREMENTS_SPEC.md, DOCUMENTATION_SPEC.md

Parent PRD: `../../../docs/product/prd/PRD.md`

## 1. Scope

PC browser shell for SDKWork platform manager operators.

## 2. Delivered Scenarios

1. IAM login at `/auth/login` with session bridged to generated SDK clients.
2. Operator preference summary and editor on the home card (`manager.preferences.retrieve` / `update`).
3. Tenant preference admin list (`manager.preferences.admin.list`).

## 3. Non-Goals

- File upload (requires `sdkwork-drive` per `DRIVE_SPEC.md`)
- H5 or native mobile surfaces (PC-only for initial release)

## 4. Success Metrics

- `pnpm --dir apps/sdkwork-manager-pc typecheck` passes
- Shell uses generated SDKs only (no raw `/app/v3` or `/backend/v3` HTTP in UI packages)
