-- sdkwork:migration
-- id: 0002_manager_commercial_entitlements
-- engine: postgres
-- module: manager
-- reversible: true

BEGIN;
DROP TABLE IF EXISTS platform_manager_entitlement_grant;
DROP TABLE IF EXISTS platform_manager_entitlement_snapshot;
COMMIT;
