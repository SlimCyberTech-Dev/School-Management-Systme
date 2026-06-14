-- Platform operator sessions (mirrors auth_sessions for school staff).
CREATE TABLE IF NOT EXISTS platform_auth_sessions (
  id UUID PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES platform_admins(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  device_info TEXT,
  ip_address TEXT,
  user_agent TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_auth_sessions_admin
  ON platform_auth_sessions (admin_id);

CREATE INDEX IF NOT EXISTS idx_platform_auth_sessions_expires
  ON platform_auth_sessions (expires_at);

CREATE INDEX IF NOT EXISTS idx_platform_auth_sessions_active
  ON platform_auth_sessions (admin_id, expires_at DESC)
  WHERE revoked_at IS NULL;

ALTER TABLE platform_admins
  ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
