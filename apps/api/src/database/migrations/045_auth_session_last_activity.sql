-- Track last API activity for idle session timeout
ALTER TABLE auth_sessions
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE auth_sessions
SET last_activity_at = COALESCE(issued_at, created_at, NOW())
WHERE last_activity_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auth_sessions_last_activity
  ON auth_sessions (last_activity_at DESC)
  WHERE revoked_at IS NULL;
