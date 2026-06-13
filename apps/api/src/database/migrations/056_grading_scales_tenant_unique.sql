-- Grading scales are per-tenant; global (level, grade) unique blocked new schools under RLS.

ALTER TABLE assessment_grading_scales
  DROP CONSTRAINT IF EXISTS assessment_grading_scales_level_grade_key;

CREATE UNIQUE INDEX IF NOT EXISTS assessment_grading_scales_tenant_level_grade_uidx
  ON assessment_grading_scales (tenant_id, level, grade);
