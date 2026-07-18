# Application Guidelines

## SDKWORK Soul

Read `../../../sdkwork-specs/SOUL.md` before executing tasks in this application root.

## SDKWORK Standards

Use `../../../sdkwork-specs/README.md` as the task router, `../../../sdkwork-specs/AGENTS_SPEC.md` for this entrypoint, and inherit the repository rules from `../../AGENTS.md`. Do not copy global standards locally.

## Application Identity

Read `sdkwork.app.config.json` for the PC surface identity, capabilities, SDK wiring, and release metadata. Read `etc/` for PC runtime source configuration.

## Local Dictionary Structure

- `src/`: application bootstrap, composition, styling, and entrypoint.
- `packages/`: authored PC shell, core, and admin capability packages; each package owns its nearest `specs/component.spec.json`.
- `specs/component.spec.json`: PC application contract.
- `etc/`: PC deployable source configuration.
- `sdkwork.app.config.json`: PC surface manifest.

## Spec Resolution Order

Use dynamic progressive loading: read this file and `../../AGENTS.md`, then the PC manifest and nearest component spec, then only task-specific standards from `../../../sdkwork-specs/` before implementation files. Language-specific specs are on-demand only.

## Required Specs By Task Type

React/admin work loads `../../../sdkwork-specs/FRONTEND_CODE_SPEC.md`, `../../../sdkwork-specs/BACKEND_UI_SPEC.md`, and `../../../sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`. SDK consumption loads `../../../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md` and `../../../sdkwork-specs/SDK_SPEC.md`. Runtime config loads `../../../sdkwork-specs/SOURCE_CONFIG_SPEC.md`. Command changes load `../../../sdkwork-specs/PNPM_SCRIPT_SPEC.md`; packaging workflows load `../../../sdkwork-specs/GITHUB_WORKFLOW_SPEC.md`. List/search work loads `../../../sdkwork-specs/PAGINATION_SPEC.md`.

## Code Style Rules

Use TypeScript package boundaries and `@sdkwork/utils`; consume composed SDK facades and the shared TokenManager. Do not introduce raw HTTP, manual authorization headers, local DTO/SDK forks, or edits under generated SDK output.

## Build, Test, and Verification

Run package-local tests and typecheck first, then repository `pnpm verify`. SDK consumer changes also run `node ../../../sdkwork-specs/tools/check-app-sdk-consumer-imports.mjs --workspace ../..`; list/search changes run `node ../../../sdkwork-specs/tools/check-pagination.mjs --workspace ../..`.

## Agent Execution Rules

Preserve unrelated worktree changes, use exact component contracts, and require evidence before completion. Stop on missing SDK methods or ambiguous app/backend ownership.

## Human Review Rules

Require human review for public UX direction, permission model changes, production credentials, security exceptions, destructive actions, and database lifecycle changes.
