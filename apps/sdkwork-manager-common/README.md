# sdkwork-manager-common

Shared TypeScript packages for the SDKWork Manager application (`SDKWORK_WORKSPACE_SPEC.md` section 1.1.2).

| Package | Role |
| --- | --- |
| `@sdkwork/manager-contracts` | Domain DTO contracts |
| `@sdkwork/manager-service` | Preference normalization and presentation helpers (`@sdkwork/utils`) |
| `@sdkwork/manager-client-core` | URL resolution, operator session storage, generated SDK service facades |

Consumed by `apps/sdkwork-manager-pc/` via `@sdkwork/manager-pc-core`.
