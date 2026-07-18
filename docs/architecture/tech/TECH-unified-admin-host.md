# Unified Admin Host Architecture

Status: active
Owner: SDKWork maintainers
Updated: 2026-07-14
Application: `sdkwork-manager-pc`

This document defines the product architecture for the PC unified administrative
workspace. It is an application-composition document. Platform requirements for
PC roots, backend-admin UI, IAM login, SDK use, configuration, and component
contracts remain authoritative in `sdkwork-specs`.

## 1. Product Boundary

`sdkwork-manager-pc` is the single PC entry point for SDKWork operators. It is
not a replacement for the business modules in sibling application workspaces.
The host owns the operational frame that lets those modules run together:

- IAM login, session validation, logout, and one shared TokenManager.
- Module discovery at build/release assembly time.
- Route namespace allocation, global navigation, module navigation, and header
  slot rendering.
- Client-side permission and entitlement hints. Backend services remain the
  authorization and entitlement authority.
- Product-level observability, error boundaries, release compatibility checks,
  and integration lifecycle status.

The host does not own domain pages, repositories, generated SDK calls, domain
permissions, domain state, domain tables, or a local copy of another product's
DTOs. A route is either a host route or belongs to exactly one module package.

## 2. PC Composition Model

```text
SDKWork Manager PC root
  -> src/bootstrap/adminModuleAssembly.ts
  -> host core: IAM runtime, TokenManager, module registry
  -> host shell: global header, module header, sidebar, route frame
  -> published pc-admin module contributions
  -> module pages -> module services -> injected generated backend SDK
  -> owning module backend-api and server authorization
```

The current PC assembly contains two contributions: the host-owned
`platform.integration` route and the IAM-owned `iam.identity-access` adapter.
The IAM adapter mounts published IAM capability packages for users, tenants,
organizations, authorization, OAuth, account binding, and audit under
`/admin/iam`. It receives a shared IAM service from bootstrap and does not copy
IAM pages, DTOs, requests, or permissions into the manager host. Product admin
modules are added only after their owning workspace publishes a compatible
contribution package and backend SDK contract.

The root source stays thin:

| Location | Responsibility |
| --- | --- |
| `src/main.tsx` | Browser entry and module assembly call. |
| `src/bootstrap/adminModuleAssembly.ts` | Explicit, reviewable build-time composition. |
| `packages/sdkwork-manager-pc-core` | IAM runtime, TokenManager, contribution validation, route registry. |
| `packages/sdkwork-manager-pc-shell` | Domain-neutral PC operational layout and Header rendering. |
| `sdkwork-<app>-pc-admin-<capability>` | One domain capability's admin pages, services, routes, i18n, permission constants, and backend SDK use. |

No feature package may import the manager root `src/` internals. No host package
may deep-import a feature module. All cross-module use goes through a published
package entry point.

## 3. Module Contribution Contract

Every candidate module exports one or more `AdminModuleContribution` values.
The contract is defined in `@sdkwork/manager-pc-core` and validates these facts
at application startup:

| Contract area | Required data | Purpose |
| --- | --- | --- |
| Identity | namespaced lowercase `id`, canonical `domain`, `capability`, package name | Auditable ownership and collision-free assembly. |
| Surface | `backend-admin` | Prevents user-console and app UI from entering the internal operator shell. |
| Routing | `/admin/<domain>/<capability>` prefix, routes, default route | Keeps route ownership exclusive and deep links stable. |
| Navigation | display name and route labels | Lets the shell render navigation without importing domain metadata. |
| Access | permission hints and `all`/`any` mode | Hides unavailable affordances only; the backend still enforces each action. |
| Header | title, description, optional context component, optional actions | Provides a module-specific contextual Header inside one global shell. |
| Commercial | entitlement key, tier, release channel | Supports packaging, trial, plan, and release policy without hard-coding billing logic into pages. |

The registry rejects duplicate module identifiers, duplicate routes, routes
outside a module prefix, non-admin surfaces, and modules without a default route.
This makes an invalid assembly fail before an operator can use it.

## 4. Header Architecture

The Header is deliberately split into three ownership levels.

| Layer | Owner | Contents | Must not contain |
| --- | --- | --- | --- |
| Global Header | host shell | product identity, module switcher, cross-module search entry, session controls | domain SDK calls, domain filters, domain permissions |
| Module Header | owning module via `header` contribution | module title, contextual summary, module-level actions, optional `Context` slot | global CSS, arbitrary navigation replacement, token handling |
| Route toolbar | owning route/page | filters, bulk commands, view tabs, selected-record actions | session logic, client construction, unrelated module controls |

This preserves a consistent operational experience while allowing IAM, commerce,
content, intelligence, device, and platform modules to expose distinct Header
semantics. A billing module can contribute period and account context; an IAM
module can contribute tenant and audit context; a Drive module can contribute
storage-space and retention context. Each retains its own service and SDK
orchestration.

Header actions are commands, not hidden business transport. A contributing
module owns the action's page/service behavior and supplies the callback. The
host only provides placement, keyboard-accessible controls, overflow behavior,
and visual tokens.

## 5. IAM And SDK Boundary

The application uses `@sdkwork/auth-pc-react` and
`@sdkwork/auth-runtime-pc-react` with `@sdkwork/iam-app-sdk` for login and
current-session validation. At every protected route entry the host validates
the current session through the IAM runtime. A failed validation clears the
central session bridge and TokenManager before redirecting to login.

Before rendering the auth surface, the host retrieves the public IAM runtime
and verification policy through the composed IAM App SDK. The resulting config
controls password, email-code, phone-code, session-bridge, registration,
recovery, OAuth, and QR entry availability. The host provides appearance and
route composition only; it does not maintain a parallel auth policy.

```text
login / refresh / current session / logout
  -> IAM app SDK through approved PC auth runtime
  -> one global TokenManager
  -> injected module backend SDK clients
  -> backend-admin API calls
```

The module package never constructs the IAM runtime, parses a token, creates
request headers, or calls raw HTTP. Bootstrap constructs each module's generated
backend SDK client and passes it to that module's service provider/factory. A
new dependency SDK must receive the same TokenManager only when it is an
authenticated app-api or explicit backend-admin API. Protected open-api SDKs
use their own declared credential provider.

Browser configuration is public and endpoint-only. The complete IAM dual-token
session is persisted by the session bridge with legacy session-storage
migration and cross-tab invalidation. The PC Vite configuration no
longer embeds `SDKWORK_ACCESS_TOKEN`; live sessions are created by IAM at
runtime. A production browser deployment must use the approved IAM storage and
cookie/secure-host strategy from the IAM integration standard before release.

The host resolves `react`, `react-dom`, `react-i18next`, and `i18next` to one
runtime copy in its Vite composition. This is required because published admin
packages are transformed from sibling workspace source during local development;
allowing each workspace to resolve its own React copy would violate the Hook
runtime contract. The host imports the canonical `@sdkwork/ui-pc-react/styles.css`
entry rather than recreating framework design tokens.

## 6. Commercial Delivery Model

Commercialization is based on modules, not forks of the host application.

1. A domain team owns a versioned `pc-admin-*` package, its backend SDK family,
   its permission model, and its release notes.
2. The package declares an `entitlementKey`, commercial tier, and release
   channel in its contribution metadata.
3. The manager release assembly chooses approved package versions and their
   declared compatibility range. Assembly is static and reviewable; arbitrary
   remote JavaScript is never executed in an authenticated operator browser.
4. A platform entitlement service resolves tenant/product access. The host may
   use that answer for navigation visibility and upgrade messaging, but the
   owning backend denies an unentitled operation regardless of UI state.
5. Release orchestration records module version, SDK compatibility, API route
   mount, migration readiness, feature-flag owner, rollback version, and
   support runbook.

This makes `foundation`, `standard`, `professional`, and `enterprise` editions
composable from the same application shell. It also supports private
installations with a smaller approved module catalog without a separate code
line.

The host obtains IAM permission scope from the authenticated session and enters
the administration shell without a commercial-entitlement bootstrap request.
Commercial offer fields remain catalog and release metadata; they do not hide
modules or block login. Owning backends continue to enforce operation permissions
and any capability-specific commercial policy at the service boundary.

## 7. Integration Workflow

Each module owner follows this sequence before requesting host registration:

1. Own the feature in `sdkwork-<application>-pc-admin-<capability>` with a
   module-local `specs/component.spec.json`.
2. Keep pages, services, state, i18n fragments, route metadata, and permission
   constants inside that package. Use injected generated backend SDK clients.
3. Export a stable contribution factory and test it with fake generated SDK
   clients. Do not publish generated SDK internals or host-private imports.
4. Declare the desired route prefix, permission hints, entitlement key, release
   channel, SDK family/version, and route mount evidence in the module release
   request.
5. Add an explicit package import and contribution factory call to
   `src/bootstrap/adminModuleAssembly.ts`. This is the only place the host is
   allowed to know that a module exists.
6. Run typecheck, contribution collision tests, consumer-import validation,
   application-layering validation, and browser smoke tests before promotion.

The first migration candidates are IAM operator capability packages because
their package family and route metadata already exist. The next groups should
be onboarded by product and release readiness, not by scanning every sibling
directory and loading unreviewed code:

| Rollout wave | Domains | Typical capabilities |
| --- | --- | --- |
| 1 | IAM, platform | users, tenants, organizations, permissions, audit, app registry |
| 2 | system, integration, Drive | system settings, providers, storage, diagnostics |
| 3 | commerce, content, communication | orders, finance, CMS, messaging, IM/RTC operations |
| 4 | intelligence, device, ecosystem | models, prompts, agents, IoT, partner modules |

## 8. Release Gates

An assembly is releasable only when every enabled contribution provides:

- a compatible `backend-admin` component contract and unique route prefix;
- generated backend SDK usage through its composed consumer package;
- IAM permission mapping and server-side authorization proof;
- entitlement and release-channel declaration for commercial modules;
- loading, empty, validation, permission-denied, unavailable, and error UI
  states in the owning module;
- package-level typecheck/tests plus host assembly/browser smoke evidence;
- a rollback package version and operator runbook.

This architecture keeps the unified manager commercially deployable while
letting each product module evolve independently and remain responsible for its
own bounded context.
