-- Phase 5: drop legacy 4-level competency_level enum columns (run only after Phase 4 app verification).
-- assessments_cbc.rating and cbc_scores.rating are unchanged — they already store UNEB A–E letters.
-- RLS is disabled per-table during backfill/cleanup (migrate role has no tenant context; see 070).

-- ---------------------------------------------------------------------------
-- competency_ratings: letter_grade (NOT NULL after this migration)
-- ---------------------------------------------------------------------------
ALTER TABLE competency_ratings DISABLE ROW LEVEL SECURITY;

UPDATE competency_ratings
SET letter_grade = CASE competency_level::text
  WHEN 'exceeds_expectations' THEN 'A'
  WHEN 'meets_expectations' THEN 'B'
  WHEN 'approaching_expectations' THEN 'C'
  WHEN 'below_expectations' THEN 'D'
END::char(1)
WHERE letter_grade IS NULL
  AND competency_level IS NOT NULL;

DO $$
DECLARE
  backfill_gap BIGINT;
  orphan_cnt BIGINT;
  remaining_null BIGINT;
BEGIN
  SELECT COUNT(*) INTO backfill_gap
  FROM competency_ratings
  WHERE letter_grade IS NULL AND competency_level IS NOT NULL;
  IF backfill_gap > 0 THEN
    RAISE EXCEPTION '076 abort: competency_ratings has % row(s) with competency_level set but letter_grade still NULL after backfill',
      backfill_gap;
  END IF;

  SELECT COUNT(*) INTO orphan_cnt
  FROM competency_ratings
  WHERE letter_grade IS NULL AND competency_level IS NULL;
  IF orphan_cnt > 0 THEN
    RAISE EXCEPTION '076 abort: competency_ratings has % orphan row(s) (letter_grade and competency_level both NULL); expected 0 per dry-run — review before re-running',
      orphan_cnt;
  END IF;

  DELETE FROM competency_ratings
  WHERE letter_grade IS NULL AND competency_level IS NULL;

  SELECT COUNT(*) INTO remaining_null FROM competency_ratings WHERE letter_grade IS NULL;
  IF remaining_null > 0 THEN
    RAISE EXCEPTION '076 abort: competency_ratings still has % NULL letter_grade after orphan cleanup', remaining_null;
  END IF;
END $$;

ALTER TABLE competency_ratings DROP COLUMN IF EXISTS competency_level;
ALTER TABLE competency_ratings
  ALTER COLUMN letter_grade SET NOT NULL;

ALTER TABLE competency_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_ratings FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- term_competency_summary: aggregated_grade NOT NULL; overridden_grade stays nullable
-- ---------------------------------------------------------------------------
ALTER TABLE term_competency_summary DISABLE ROW LEVEL SECURITY;

UPDATE term_competency_summary
SET aggregated_grade = CASE aggregated_level::text
  WHEN 'exceeds_expectations' THEN 'A'
  WHEN 'meets_expectations' THEN 'B'
  WHEN 'approaching_expectations' THEN 'C'
  WHEN 'below_expectations' THEN 'D'
END::char(1)
WHERE aggregated_grade IS NULL
  AND aggregated_level IS NOT NULL;

UPDATE term_competency_summary
SET overridden_grade = CASE overridden_level::text
  WHEN 'exceeds_expectations' THEN 'A'
  WHEN 'meets_expectations' THEN 'B'
  WHEN 'approaching_expectations' THEN 'C'
  WHEN 'below_expectations' THEN 'D'
END::char(1)
WHERE overridden_grade IS NULL
  AND overridden_level IS NOT NULL;

DO $$
DECLARE
  agg_backfill_gap BIGINT;
  agg_orphan_cnt BIGINT;
  agg_remaining_null BIGINT;
  ovr_backfill_gap BIGINT;
BEGIN
  SELECT COUNT(*) INTO agg_backfill_gap
  FROM term_competency_summary
  WHERE aggregated_grade IS NULL AND aggregated_level IS NOT NULL;
  IF agg_backfill_gap > 0 THEN
    RAISE EXCEPTION '076 abort: term_competency_summary has % row(s) with aggregated_level set but aggregated_grade still NULL after backfill',
      agg_backfill_gap;
  END IF;

  SELECT COUNT(*) INTO agg_orphan_cnt
  FROM term_competency_summary
  WHERE aggregated_grade IS NULL AND aggregated_level IS NULL;
  IF agg_orphan_cnt > 0 THEN
    RAISE EXCEPTION '076 abort: term_competency_summary has % orphan row(s) (aggregated_grade and aggregated_level both NULL); expected 0 per dry-run — review before re-running',
      agg_orphan_cnt;
  END IF;

  DELETE FROM term_competency_summary
  WHERE aggregated_grade IS NULL AND aggregated_level IS NULL;

  SELECT COUNT(*) INTO agg_remaining_null
  FROM term_competency_summary
  WHERE aggregated_grade IS NULL;
  IF agg_remaining_null > 0 THEN
    RAISE EXCEPTION '076 abort: term_competency_summary still has % NULL aggregated_grade after orphan cleanup', agg_remaining_null;
  END IF;

  SELECT COUNT(*) INTO ovr_backfill_gap
  FROM term_competency_summary
  WHERE overridden_grade IS NULL AND overridden_level IS NOT NULL;
  IF ovr_backfill_gap > 0 THEN
    RAISE EXCEPTION '076 abort: term_competency_summary has % row(s) with overridden_level set but overridden_grade still NULL after backfill',
      ovr_backfill_gap;
  END IF;
END $$;

ALTER TABLE term_competency_summary DROP COLUMN IF EXISTS aggregated_level;
ALTER TABLE term_competency_summary DROP COLUMN IF EXISTS overridden_level;
ALTER TABLE term_competency_summary
  ALTER COLUMN aggregated_grade SET NOT NULL;

ALTER TABLE term_competency_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_competency_summary FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- learning_outcome_records: achievement_grade (NOT NULL after this migration)
-- ---------------------------------------------------------------------------
ALTER TABLE learning_outcome_records DISABLE ROW LEVEL SECURITY;

UPDATE learning_outcome_records
SET achievement_grade = CASE achievement_level::text
  WHEN 'exceeds_expectations' THEN 'A'
  WHEN 'meets_expectations' THEN 'B'
  WHEN 'approaching_expectations' THEN 'C'
  WHEN 'below_expectations' THEN 'D'
END::char(1)
WHERE achievement_grade IS NULL
  AND achievement_level IS NOT NULL;

DO $$
DECLARE
  backfill_gap BIGINT;
  orphan_cnt BIGINT;
  remaining_null BIGINT;
BEGIN
  SELECT COUNT(*) INTO backfill_gap
  FROM learning_outcome_records
  WHERE achievement_grade IS NULL AND achievement_level IS NOT NULL;
  IF backfill_gap > 0 THEN
    RAISE EXCEPTION '076 abort: learning_outcome_records has % row(s) with achievement_level set but achievement_grade still NULL after backfill',
      backfill_gap;
  END IF;

  SELECT COUNT(*) INTO orphan_cnt
  FROM learning_outcome_records
  WHERE achievement_grade IS NULL AND achievement_level IS NULL;
  IF orphan_cnt > 0 THEN
    RAISE EXCEPTION '076 abort: learning_outcome_records has % orphan row(s) (achievement_grade and achievement_level both NULL); expected 0 per dry-run — review before re-running',
      orphan_cnt;
  END IF;

  DELETE FROM learning_outcome_records
  WHERE achievement_grade IS NULL AND achievement_level IS NULL;

  SELECT COUNT(*) INTO remaining_null FROM learning_outcome_records WHERE achievement_grade IS NULL;
  IF remaining_null > 0 THEN
    RAISE EXCEPTION '076 abort: learning_outcome_records still has % NULL achievement_grade after orphan cleanup', remaining_null;
  END IF;
END $$;

ALTER TABLE learning_outcome_records DROP COLUMN IF EXISTS achievement_level;
ALTER TABLE learning_outcome_records
  ALTER COLUMN achievement_grade SET NOT NULL;

ALTER TABLE learning_outcome_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_outcome_records FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- assessments_cbc / cbc_scores: drop nullable competency_level only (rating CHAR(1) unchanged, no NOT NULL change)
-- ---------------------------------------------------------------------------
ALTER TABLE assessments_cbc DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbc_scores DISABLE ROW LEVEL SECURITY;

ALTER TABLE assessments_cbc DROP COLUMN IF EXISTS competency_level;
ALTER TABLE cbc_scores DROP COLUMN IF EXISTS competency_level;

ALTER TABLE assessments_cbc ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments_cbc FORCE ROW LEVEL SECURITY;
ALTER TABLE cbc_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbc_scores FORCE ROW LEVEL SECURITY;

DROP FUNCTION IF EXISTS competency_level_rank(competency_level);

DROP TYPE IF EXISTS competency_level;
