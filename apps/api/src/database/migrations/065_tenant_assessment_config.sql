-- Tenant assessment rules (CA conversion, compulsory subjects) and grading scheme flags.

ALTER TABLE tenant_settings
  ADD COLUMN IF NOT EXISTS assessment_config JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE tenant_settings
  ADD COLUMN IF NOT EXISTS grading_config JSONB NOT NULL DEFAULT '{"oLevel":{"scheme":"cbc_2024_v1"},"aLevel":{"scheme":"legacy_uneb_points_v1"}}'::jsonb;

COMMENT ON COLUMN tenant_settings.assessment_config IS
  'O-Level CBC: CA/EOC weights, school CA rules, compulsory subject overrides.';

COMMENT ON COLUMN tenant_settings.grading_config IS
  'Per-level grading scheme version (A-Level default legacy UNEB points).';
