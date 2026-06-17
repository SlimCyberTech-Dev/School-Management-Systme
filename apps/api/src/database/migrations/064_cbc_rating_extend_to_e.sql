-- Extend O-Level CBC competency ratings to official A–E bands (no fail grade).

ALTER TABLE assessments_cbc DROP CONSTRAINT IF EXISTS assessments_cbc_rating_check;
ALTER TABLE assessments_cbc
  ADD CONSTRAINT assessments_cbc_rating_check CHECK (rating IN ('A', 'B', 'C', 'D', 'E'));

ALTER TABLE cbc_scores DROP CONSTRAINT IF EXISTS cbc_scores_rating_check;
ALTER TABLE cbc_scores
  ADD CONSTRAINT cbc_scores_rating_check CHECK (rating IN ('A', 'B', 'C', 'D', 'E'));
