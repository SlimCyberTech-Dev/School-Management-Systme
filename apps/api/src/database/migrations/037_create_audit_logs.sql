-- System-wide audit logs (admin monitoring, archive, permanent delete)

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(32) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'info',
  outcome VARCHAR(16) NOT NULL DEFAULT 'success',
  action VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resource_type VARCHAR(64),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  http_method VARCHAR(10),
  http_path TEXT,
  http_status INT,
  metadata JSONB,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_outcome ON audit_logs(outcome);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_active_created_at ON audit_logs(created_at DESC)
  WHERE archived_at IS NULL;

-- Backfill from legacy user_audit_logs
INSERT INTO audit_logs (
  category,
  severity,
  outcome,
  action,
  message,
  actor_id,
  target_user_id,
  ip_address,
  user_agent,
  metadata,
  created_at
)
SELECT
  CASE
    WHEN l.action IN ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT') THEN 'auth'
    ELSE 'users'
  END,
  CASE
    WHEN l.action IN ('LOGIN_FAILED') THEN 'warning'
    WHEN l.action LIKE '%DELETED%' THEN 'warning'
    ELSE 'info'
  END,
  CASE
    WHEN l.action IN ('LOGIN_FAILED') THEN 'failure'
    ELSE 'success'
  END,
  l.action,
  COALESCE(
    l.metadata->>'message',
    l.action || ' (migrated)'
  ),
  l.actor_id,
  l.user_id,
  l.ip_address,
  l.user_agent,
  l.metadata,
  l.created_at
FROM user_audit_logs l
WHERE NOT EXISTS (
  SELECT 1 FROM audit_logs a
  WHERE a.created_at = l.created_at
    AND a.action = l.action
    AND a.target_user_id IS NOT DISTINCT FROM l.user_id
    AND a.actor_id IS NOT DISTINCT FROM l.actor_id
  LIMIT 1
);
