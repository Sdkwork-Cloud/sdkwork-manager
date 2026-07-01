# SDKWork Manager PC Technical Architecture

Status: active
Owner: SDKWork maintainers
Updated: 2026-06-30
Specs: `sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`, `FRONTEND_SPEC.md`

## 1. Architecture Overview

`sdkwork-manager-pc` is the browser operator console for the platform manager capability. It authenticates through IAM, loads operator preferences via the generated app SDK, and exposes tenant administration views through the generated backend SDK.

Repository-wide HTTP and database architecture: `../../../docs/architecture/tech/TECH_ARCHITECTURE.md`.

## 2. Technology Choices

| Layer | Technology |
| --- | --- |
| UI | React 19 + Vite |
| Routing | `react-router-dom` |
| Auth | `@sdkwork/auth-pc-react` + `auth-runtime-pc-react` |
| SDK clients | `sdkwork-manager-app-sdk`, `sdkwork-manager-backend-sdk` |
| Shared helpers | `@sdkwork/manager-client-core`, `@sdkwork/utils` |

## 3. Package Layout

- `packages/sdkwork-manager-pc-core`: IAM runtime, session bridge, SDK client factories
- `packages/sdkwork-manager-pc-shell`: Auth routes, protected shell, admin panels
- `src/`: Vite entry (`main.tsx`) and global styles

## 4. Runtime Flow

1. Unauthenticated users route to `/auth/login`.
2. `RequireOperatorSession` guards the main shell.
3. Shell loads and edits preferences via app SDK (`retrieve` / `update`)
4. `listAdminPreferences()` loads tenant summaries for administration

## 5. Local Development

```bash
pnpm --dir apps/sdkwork-manager-pc dev   # http://127.0.0.1:5190
pnpm start                               # API gateway http://127.0.0.1:18092 (repo root)
```

Vite dev proxy is configured through `@sdkwork/manager-client-core` (`buildManagerViteDevProxy`).
Production builds resolve workspace SDK packages through `apps/sdkwork-manager-pc/vite.config.ts` aliases aligned with `tsconfig.base.json`.

## 6. Verification

```bash
pnpm --dir apps/sdkwork-manager-pc typecheck
pnpm build
pnpm test
```
