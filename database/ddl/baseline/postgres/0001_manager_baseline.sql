-- SDKWork manager baseline (platform_manager_preference)
CREATE TABLE IF NOT EXISTS platform_manager_preference (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  pinned_app_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  theme TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS platform_manager_entitlement_snapshot (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  app_id TEXT NOT NULL,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  valid_until TIMESTAMPTZ,
  version BIGINT NOT NULL DEFAULT 1,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, app_id),
  CHECK (tier IN ('foundation', 'standard', 'professional', 'enterprise')),
  CHECK (status IN ('active', 'suspended', 'expired')),
  CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_platform_manager_entitlement_snapshot_expiry
  ON platform_manager_entitlement_snapshot (tenant_id, status, valid_until);

CREATE TABLE IF NOT EXISTS platform_manager_entitlement_grant (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  app_id TEXT NOT NULL,
  entitlement_key TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  updated_by TEXT NOT NULL,
  UNIQUE (tenant_id, app_id, entitlement_key),
  FOREIGN KEY (tenant_id, app_id)
    REFERENCES platform_manager_entitlement_snapshot (tenant_id, app_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_platform_manager_entitlement_grant_active
  ON platform_manager_entitlement_grant (tenant_id, app_id, entitlement_key)
  WHERE revoked_at IS NULL;
