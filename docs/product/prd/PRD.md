# Manager PRD

Status: active
Owner: SDKWork maintainers
Application: sdkwork-manager
Updated: 2026-06-30
Specs: REQUIREMENTS_SPEC.md, DOCUMENTATION_SPEC.md

## 1. Background And Problem

SDKWork needs a platform manager capability for operator workflows, tenant administration, and unified PC admin experiences. The application must follow sdkwork-specs for HTTP envelopes, IAM login, database lifecycle, and generated SDK consumption.

## 2. Target Users

- Platform operators with backend-root-admin profile
- Tenant administrators managing preferences and console configuration

## 3. Goals And Non-Goals

Goals:

- IAM-authenticated PC admin shell with generated app/backend SDK clients
- Rust HTTP gateway with `sdkwork-web-framework` and `sdkwork-database`
- Standard `SdkWorkApiResponse` / `ProblemDetail` on all owned APIs

Non-goals (current release):

- RPC services and `sdkwork-discovery` integration
- File upload features without `sdkwork-drive` integration

## 4. Scope

- Preferences API (`/app/v3/api/manager/preferences`, backend admin list)
- PC React operator shell with auth routes
- Standalone and cloud deployment profiles

## 5. User Scenarios

1. Operator signs in through IAM `/auth/login`
2. Operator signs in through IAM `/auth/login`
3. Shell loads and edits preferences via `sdkwork-manager-app-sdk` (`retrieve` / `update`)
4. Backend admin lists tenant preferences via `sdkwork-manager-backend-sdk`

## 6. Success Metrics

- `pnpm verify` and `pnpm test` pass in CI
- IAM session propagates to SDK clients through `TokenManager`
- No legacy portal naming or non-standard API envelopes

## 7. Phases

| Phase | Deliverable |
| --- | --- |
| M0 | Repository scaffold + verify pipeline |
| M1 | IAM login, SDK client wiring, tenant preference admin panel (current) |
| M2 | Extended admin modules + drive-backed uploads |
| M3 | Production packaging and IAM PlusApp bootstrap execution |

## 8. Linked Requirements

- `WEB_FRAMEWORK_SPEC.md`, `DATABASE_FRAMEWORK_SPEC.md`, `API_SPEC.md`
- `IAM_LOGIN_INTEGRATION_SPEC.md`, `APP_SDK_INTEGRATION_SPEC.md`
- `DRIVE_SPEC.md` (before any upload feature)

## 9. Open Questions

- Which additional admin domains ship in the first commercial release beyond preferences?
