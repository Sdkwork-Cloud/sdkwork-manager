# Repository Guidelines

<!-- SDKWORK-AGENTS-GENERATED: v2 -->

## SDKWORK Soul

Read `../sdkwork-specs/SOUL.md` before executing repository tasks. Follow specs before memory, dictionary before context, stop on ambiguity, and evidence before completion.

## SDKWORK Standards

Use `../sdkwork-specs/README.md` as the task router and `../sdkwork-specs/AGENTS_SPEC.md` for this entrypoint. Do not copy global standards into this repository. If the relative specs path does not resolve, stop and report the broken workspace layout.

## Application Identity

Read `sdkwork.app.config.json` and `apps/sdkwork-manager-pc/sdkwork.app.config.json` when changing application identity, behavior, SDK wiring, owned capabilities, or release metadata. Read `etc/` for runtime URLs, binds, topology, profiles, and deployable source configuration; application manifests are not runtime configuration authority.

## Local Dictionary Structure

- `AGENTS.md`: repository agent entrypoint and task router.
- `.sdkwork/`: local skills, plugins, manifests, and AI workspace metadata.
- `sdkwork.app.config.json`: repository application identity and release manifest.
- `apps/sdkwork-manager-pc/`: PC browser/desktop manager application root.
- `apps/sdkwork-manager-common/packages/`: shared TypeScript contracts, client core, and service normalization.
- `specs/`: repository-wide machine contracts; authored modules own their nearest `specs/component.spec.json`.
- `apis/`: authored Manager API contracts.
- `sdks/`: Manager SDK families and generator-owned artifacts.
- `crates/`: Manager Rust services, routes, hosts, and standalone gateway.
- `database/`: `sdkwork-database` lifecycle assets.
- `etc/`: deployable-root source configuration and environment profiles.
- `deployments/`, `scripts/`, `tools/`, `docs/`, `tests/`: deployment descriptors, automation, documentation, and verification assets.
- `package.json`, `Cargo.toml`, `pnpm-workspace.yaml`: native build and dependency authorities.

Documentation Canon: [`docs/product/prd/PRD.md`](docs/product/prd/PRD.md) and [`docs/architecture/tech/TECH_ARCHITECTURE.md`](docs/architecture/tech/TECH_ARCHITECTURE.md).

## Spec Resolution Order

Resolve the repository or application root and task boundary first. Use dynamic progressive loading: read the applicable app manifest and nearest module `specs/component.spec.json`, then use the matching row in `../sdkwork-specs/README.md` to load only task-specific global specs before implementation files. Expand progressively only when evidence crosses another boundary. Language-specific specs are on-demand only, never a repository-wide startup bundle.

## Required Specs By Task Type

- TypeScript or Node changes: `../sdkwork-specs/CODE_STYLE_SPEC.md`, `../sdkwork-specs/NAMING_SPEC.md`, and on demand `../sdkwork-specs/TYPESCRIPT_CODE_SPEC.md`.
- React/admin UI changes: `../sdkwork-specs/FRONTEND_CODE_SPEC.md`, `../sdkwork-specs/BACKEND_UI_SPEC.md`, and `../sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`.
- Rust/runtime changes: `../sdkwork-specs/RUST_CODE_SPEC.md`, `../sdkwork-specs/WEB_FRAMEWORK_SPEC.md`, and the applicable database/runtime spec.
- SDK generation or consumption: `../sdkwork-specs/SDK_SPEC.md`, `../sdkwork-specs/SDK_WORKSPACE_GENERATION_SPEC.md`, `../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md`, and `../sdkwork-specs/API_SPEC.md`.
- API contract changes: `../sdkwork-specs/API_SPEC.md`; list/search work also loads `../sdkwork-specs/PAGINATION_SPEC.md` and runs `node ../sdkwork-specs/tools/check-pagination.mjs --workspace .`.
- Source configuration changes: `../sdkwork-specs/SOURCE_CONFIG_SPEC.md` and the applicable topology/deployment spec.
- Package scripts and release workflows: `../sdkwork-specs/PNPM_SCRIPT_SPEC.md`, `../sdkwork-specs/GITHUB_WORKFLOW_SPEC.md`, `../sdkwork-specs/RELEASE_SPEC.md`, and `../sdkwork-specs/SUPPLY_CHAIN_SECURITY_SPEC.md`.
- Database lifecycle or schema changes: `../sdkwork-specs/DATABASE_FRAMEWORK_SPEC.md` and the applicable database specs.

## Code Style Rules

Use native workspace helpers and `@sdkwork/utils`; do not create local duplicates. Generated output under `sdks/**/generated/**` is generator-owned. Keep app/backend API boundaries separate, use `sdkwork-web-framework` for Rust HTTP response mapping, and use `sdkwork-drive` SDK or server uploader for file uploads.

## Build, Test, and Verification

Use repository scripts as the command authority. Run the narrowest relevant checks before `pnpm verify`; for release work also run `pnpm release:validate`, the workflow framework validator, and `node ../sdkwork-specs/tools/check-agent-workflow-standard.mjs --root .`. SDK consumer changes must run `node ../sdkwork-specs/tools/check-app-sdk-consumer-imports.mjs --workspace .`; API/list changes must run the operation, envelope, and pagination validators from `../sdkwork-specs/tools/`.

## Agent Execution Rules

Inspect existing dirty worktree changes before editing and preserve unrelated user work. Use exact contracts before inference, never hand-edit generated SDK output, and do not bypass SDKs with raw HTTP, manual auth headers, local forks, or compatibility transports. Record command evidence before claiming completion. Stop when an owner contract, SDK method, or required relative spec is ambiguous or missing.

## Human Review Rules

Human approval is required for ambiguous product direction, breaking public contracts, security exceptions, database schema or migration changes, destructive operations, production credential use, and production traffic cutover. Real environment health, tenant isolation, payment/provider credentials, IAM bootstrap, and rollback evidence remain human-reviewed release gates.
