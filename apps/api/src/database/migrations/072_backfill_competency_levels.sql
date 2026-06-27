-- Backfill competency_level from legacy letter ratings (A–E → 4-level descriptors).
-- E maps to below_expectations (lossy collapse — see verification notices below).

CREATE OR REPLACE FUNCTION _map_rating_to_competency_level(rating CHAR(1))
RETURNS competency_level
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE upper(trim(rating))
    WHEN 'A' THEN 'exceeds_expectations'::competency_level
    WHEN 'B' THEN 'meets_expectations'::competency_level
    WHEN 'C' THEN 'approaching_expectations'::competency_level
    WHEN 'D' THEN 'below_expectations'::competency_level
    WHEN 'E' THEN 'below_expectations'::competency_level
    ELSE NULL
  END;
$$;

UPDATE assessments_cbc
SET competency_level = _map_rating_to_competency_level(rating)
WHERE rating IS NOT NULL
  AND trim(rating) <> '';

UPDATE cbc_scores
SET competency_level = _map_rating_to_competency_level(rating)
WHERE rating IS NOT NULL
  AND trim(rating) <> '';

DO $$
DECLARE
  ac_total_with_rating BIGINT;
  ac_backfilled BIGINT;
  ac_mismatch BIGINT;
  ac_null_rating BIGINT;
  ac_e_collapse BIGINT;
  cs_total_with_rating BIGINT;
  cs_backfilled BIGINT;
  cs_mismatch BIGINT;
  cs_null_rating BIGINT;
  cs_e_collapse BIGINT;
BEGIN
  SELECT COUNT(*) INTO ac_total_with_rating
  FROM assessments_cbc
  WHERE rating IS NOT NULL AND trim(rating) <> '';

  SELECT COUNT(*) INTO ac_backfilled
  FROM assessments_cbc
  WHERE competency_level IS NOT NULL;

  SELECT COUNT(*) INTO ac_mismatch
  FROM assessments_cbc
  WHERE rating IS NOT NULL
    AND trim(rating) <> ''
    AND competency_level IS DISTINCT FROM _map_rating_to_competency_level(rating);

  SELECT COUNT(*) INTO ac_null_rating
  FROM assessments_cbc
  WHERE rating IS NULL OR trim(rating) = '';

  SELECT COUNT(*) INTO ac_e_collapse
  FROM assessments_cbc
  WHERE upper(trim(rating)) = 'E';

  SELECT COUNT(*) INTO cs_total_with_rating
  FROM cbc_scores
  WHERE rating IS NOT NULL AND trim(rating) <> '';

  SELECT COUNT(*) INTO cs_backfilled
  FROM cbc_scores
  WHERE competency_level IS NOT NULL;

  SELECT COUNT(*) INTO cs_mismatch
  FROM cbc_scores
  WHERE rating IS NOT NULL
    AND trim(rating) <> ''
    AND competency_level IS DISTINCT FROM _map_rating_to_competency_level(rating);

  SELECT COUNT(*) INTO cs_null_rating
  FROM cbc_scores
  WHERE rating IS NULL OR trim(rating) = '';

  SELECT COUNT(*) INTO cs_e_collapse
  FROM cbc_scores
  WHERE upper(trim(rating)) = 'E';

  RAISE NOTICE '=== 072 backfill verification: assessments_cbc ===';
  RAISE NOTICE 'rows with rating: %', ac_total_with_rating;
  RAISE NOTICE 'rows with competency_level set: %', ac_backfilled;
  RAISE NOTICE 'mismatch (rating vs competency_level): %', ac_mismatch;
  RAISE NOTICE 'rows without rating (skipped): %', ac_null_rating;
  RAISE NOTICE 'E → below_expectations collapse count: %', ac_e_collapse;

  RAISE NOTICE '=== 072 backfill verification: cbc_scores ===';
  RAISE NOTICE 'rows with rating: %', cs_total_with_rating;
  RAISE NOTICE 'rows with competency_level set: %', cs_backfilled;
  RAISE NOTICE 'mismatch (rating vs competency_level): %', cs_mismatch;
  RAISE NOTICE 'rows without rating (skipped): %', cs_null_rating;
  RAISE NOTICE 'E → below_expectations collapse count: %', cs_e_collapse;

  IF ac_mismatch > 0 OR cs_mismatch > 0 THEN
    RAISE WARNING '072 backfill: mismatch count > 0 — review before dropping rating column.';
  END IF;
END $$;

-- Mapping helper was only needed for backfill; drop to avoid casual API/SQL use.
DROP FUNCTION IF EXISTS _map_rating_to_competency_level(CHAR(1));
