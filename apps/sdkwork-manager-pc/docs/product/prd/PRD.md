# SDKWork Manager PC PRD

Status: active
Owner: SDKWork maintainers
Application: sdkwork-manager-pc
Updated: 2026-07-14
Specs: REQUIREMENTS_SPEC.md, DOCUMENTATION_SPEC.md

Parent PRD: `../../../docs/product/prd/PRD.md`

## 1. Scope

PC browser host for SDKWork internal operators. It assembles approved
`backend-admin` module packages from SDKWork application workspaces into one
authenticated operational workspace. The host owns composition, not product
business behavior.

## 2. Delivered Scenarios

1. IAM login at `/auth/login`, current-session validation on protected routes,
   and centralized logout through the approved IAM PC runtime.
2. A PC operational shell with global Header, module switcher, module Header,
   responsive module Sidebar, and an IAM-protected integration workspace.
3. A typed `AdminModuleContribution` contract that reserves module route
   namespaces, Header slots, permission hints, and commercial metadata.
4. IAM Identity & Access integration at `/admin/iam`, mounting published IAM
   user, tenant, organization, authorization, OAuth, account-binding, and audit
   capabilities without moving their business implementation into the host.
5. Explicit build-time module assembly in `src/bootstrap/adminModuleAssembly.ts`.
6. Permission-filtered navigation and fail-closed commercial metadata. Paid
   modules remain disabled until an approved entitlement provider is composed.

## 3. Non-Goals

- Domain business pages, domain data services, and domain SDK client factories
  in the manager host package.
- Dynamic execution of arbitrary remote module code in the authenticated
  browser.
- H5 or native mobile surfaces (PC-only for initial release).

## 4. Success Metrics

- `pnpm --dir apps/sdkwork-manager-pc typecheck` passes
- Host has no raw `/app/v3` or `/backend/v3` HTTP calls and does not embed
  development access tokens in the browser bundle.
- Every enabled module declares one owner, one route prefix, backend-admin SDK
  boundary, permission hints, and commercial availability metadata.
- IAM module navigation exposes only routes allowed by the active IAM
  permission scope and redirects to an allowed module default route.
- Typecheck and PC production build pass before a module assembly is released.
