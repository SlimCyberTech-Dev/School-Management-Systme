-- O-Level CBC grading bands: points optional (no stanine for CBC).

ALTER TABLE assessment_grading_scales
  ALTER COLUMN points DROP NOT NULL;

-- Do not overwrite tenant custom rows; only insert defaults when none exist (per tenant via RLS at seed time).
