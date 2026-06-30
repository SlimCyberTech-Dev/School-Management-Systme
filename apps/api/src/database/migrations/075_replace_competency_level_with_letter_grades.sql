-- Phase 1: add UNEB A–E letter columns alongside legacy competency_level enum (verify before 076 drop).
-- Reverse of dual-write mapping (072): exceeds→A, meets→B, approaching→C, below→D (lossy for original E).

CREATE OR REPLACE FUNCTION _map_competency_level_to_letter_grade(level competency_level)
RETURNS CHAR(1)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE level
    WHEN 'exceeds_expectations'::competency_level THEN 'A'::char(1)
    WHEN 'meets_expectations'::competency_level THEN 'B'::char(1)
    WHEN 'approaching_expectations'::competency_level THEN 'C'::char(1)
    WHEN 'below_expectations'::competency_level THEN 'D'::char(1)
  END;
$$;

COMMENT ON FUNCTION _map_competency_level_to_letter_grade(competency_level) IS
  'One-way backfill helper: 4-level descriptor → UNEB letter. below_expectations always maps to D (E indistinguishable).';

-- competency_ratings
ALTER TABLE competency_ratings
  ADD COLUMN IF NOT EXISTS letter_grade CHAR(1);

ALTER TABLE competency_ratings DROP CONSTRAINT IF EXISTS competency_ratings_letter_grade_check;
ALTER TABLE competency_ratings
  ADD CONSTRAINT competency_ratings_letter_grade_check
  CHECK (letter_grade IS NULL OR letter_grade IN ('A', 'B', 'C', 'D', 'E'));

COMMENT ON COLUMN competency_ratings.letter_grade IS
  'UNEB formative achievement letter (A–E). Replaces competency_level after migration 076.';

-- term_competency_summary
ALTER TABLE term_competency_summary
  ADD COLUMN IF NOT EXISTS aggregated_grade CHAR(1),
  ADD COLUMN IF NOT EXISTS overridden_grade CHAR(1);

ALTER TABLE term_competency_summary DROP CONSTRAINT IF EXISTS term_competency_summary_aggregated_grade_check;
ALTER TABLE term_competency_summary
  ADD CONSTRAINT term_competency_summary_aggregated_grade_check
  CHECK (aggregated_grade IS NULL OR aggregated_grade IN ('A', 'B', 'C', 'D', 'E'));

ALTER TABLE term_competency_summary DROP CONSTRAINT IF EXISTS term_competency_summary_overridden_grade_check;
ALTER TABLE term_competency_summary
  ADD CONSTRAINT term_competency_summary_overridden_grade_check
  CHECK (overridden_grade IS NULL OR overridden_grade IN ('A', 'B', 'C', 'D', 'E'));

COMMENT ON COLUMN term_competency_summary.aggregated_grade IS
  'UNEB letter aggregated from activity ratings. Replaces aggregated_level after 076.';
COMMENT ON COLUMN term_competency_summary.overridden_grade IS
  'Headteacher override letter. Replaces overridden_level after 076.';

-- learning_outcome_records
ALTER TABLE learning_outcome_records
  ADD COLUMN IF NOT EXISTS achievement_grade CHAR(1);

ALTER TABLE learning_outcome_records DROP CONSTRAINT IF EXISTS learning_outcome_records_achievement_grade_check;
ALTER TABLE learning_outcome_records
  ADD CONSTRAINT learning_outcome_records_achievement_grade_check
  CHECK (achievement_grade IS NULL OR achievement_grade IN ('A', 'B', 'C', 'D', 'E'));

COMMENT ON COLUMN learning_outcome_records.achievement_grade IS
  'UNEB achievement letter for this outcome. Replaces achievement_level after 076.';

-- Backfill
UPDATE competency_ratings
SET letter_grade = _map_competency_level_to_letter_grade(competency_level)
WHERE competency_level IS NOT NULL
  AND letter_grade IS NULL;

UPDATE term_competency_summary
SET aggregated_grade = _map_competency_level_to_letter_grade(aggregated_level)
WHERE aggregated_level IS NOT NULL
  AND aggregated_grade IS NULL;

UPDATE term_competency_summary
SET overridden_grade = _map_competency_level_to_letter_grade(overridden_level)
WHERE overridden_level IS NOT NULL
  AND overridden_grade IS NULL;

UPDATE learning_outcome_records
SET achievement_grade = _map_competency_level_to_letter_grade(achievement_level)
WHERE achievement_level IS NOT NULL
  AND achievement_grade IS NULL;

DO $$
DECLARE
  cr_backfilled BIGINT;
  cr_below_to_d BIGINT;
  tcs_agg_backfilled BIGINT;
  tcs_agg_below_to_d BIGINT;
  tcs_ovr_backfilled BIGINT;
  tcs_ovr_below_to_d BIGINT;
  lor_backfilled BIGINT;
  lor_below_to_d BIGINT;
BEGIN
  SELECT COUNT(*) INTO cr_backfilled
  FROM competency_ratings
  WHERE letter_grade IS NOT NULL;

  SELECT COUNT(*) INTO cr_below_to_d
  FROM competency_ratings
  WHERE competency_level = 'below_expectations'::competency_level
    AND letter_grade = 'D';

  SELECT COUNT(*) INTO tcs_agg_backfilled
  FROM term_competency_summary
  WHERE aggregated_grade IS NOT NULL;

  SELECT COUNT(*) INTO tcs_agg_below_to_d
  FROM term_competency_summary
  WHERE aggregated_level = 'below_expectations'::competency_level
    AND aggregated_grade = 'D';

  SELECT COUNT(*) INTO tcs_ovr_backfilled
  FROM term_competency_summary
  WHERE overridden_grade IS NOT NULL;

  SELECT COUNT(*) INTO tcs_ovr_below_to_d
  FROM term_competency_summary
  WHERE overridden_level = 'below_expectations'::competency_level
    AND overridden_grade = 'D';

  SELECT COUNT(*) INTO lor_backfilled
  FROM learning_outcome_records
  WHERE achievement_grade IS NOT NULL;

  SELECT COUNT(*) INTO lor_below_to_d
  FROM learning_outcome_records
  WHERE achievement_level = 'below_expectations'::competency_level
    AND achievement_grade = 'D';

  RAISE NOTICE '075 letter_grade backfill: competency_ratings rows with letter_grade=%', cr_backfilled;
  RAISE NOTICE '075 below_expectations→D (lossy): competency_ratings=%', cr_below_to_d;
  RAISE NOTICE '075 aggregated_grade backfill: term_competency_summary rows=%', tcs_agg_backfilled;
  RAISE NOTICE '075 below_expectations→D (lossy): term_competency_summary aggregated=%', tcs_agg_below_to_d;
  RAISE NOTICE '075 overridden_grade backfill: term_competency_summary rows=%', tcs_ovr_backfilled;
  RAISE NOTICE '075 below_expectations→D (lossy): term_competency_summary overridden=%', tcs_ovr_below_to_d;
  RAISE NOTICE '075 achievement_grade backfill: learning_outcome_records rows=%', lor_backfilled;
  RAISE NOTICE '075 below_expectations→D (lossy): learning_outcome_records=%', lor_below_to_d;
END $$;

DROP FUNCTION IF EXISTS _map_competency_level_to_letter_grade(competency_level);
