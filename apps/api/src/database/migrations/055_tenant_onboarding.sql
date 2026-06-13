-- Per-tenant onboarding progress for new school setup wizard.

ALTER TABLE tenant_settings
  ADD COLUMN IF NOT EXISTS onboarding JSONB NOT NULL DEFAULT '{"skippedSteps":[]}'::jsonb;

COMMENT ON COLUMN tenant_settings.onboarding IS
  'Setup wizard state: completedAt, skippedSteps, staffInvited, etc.';

-- Existing schools skip the wizard (already configured).
UPDATE tenant_settings
SET onboarding = onboarding || jsonb_build_object('completedAt', to_jsonb(NOW()::text))
WHERE onboarding->>'completedAt' IS NULL;
