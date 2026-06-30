-- Deactivate pre-reform O-Level bands (O, F, etc.) from migration 025 so they cannot surface in
-- composite grade mapping or formative achievement descriptor labels.

DO $$
DECLARE
  deactivated_count BIGINT;
  rec RECORD;
BEGIN
  UPDATE assessment_grading_scales
  SET is_active = FALSE,
      updated_at = NOW()
  WHERE level = 'O_LEVEL'
    AND grade NOT IN ('A', 'B', 'C', 'D', 'E')
    AND is_active = TRUE;

  GET DIAGNOSTICS deactivated_count = ROW_COUNT;

  RAISE NOTICE '077: deactivated % stale non-A–E O_LEVEL grading band row(s)', deactivated_count;

  FOR rec IN
    SELECT t.slug AS tenant_slug, ags.grade, ags.descriptor
    FROM assessment_grading_scales ags
    JOIN tenants t ON t.id = ags.tenant_id
    WHERE ags.level = 'O_LEVEL'
      AND ags.grade NOT IN ('A', 'B', 'C', 'D', 'E')
      AND ags.is_active = FALSE
    ORDER BY t.slug, ags.grade
  LOOP
    RAISE NOTICE '077 tenant=% grade=% descriptor=% (now inactive)',
      rec.tenant_slug, rec.grade, rec.descriptor;
  END LOOP;
END $$;
