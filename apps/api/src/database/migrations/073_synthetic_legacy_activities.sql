-- Synthetic assessment_activities + competency_ratings from legacy assessments_cbc rows.
-- activity_type defaults to 'test' (legacy rows did not record activity type — best guess).
-- Title format: 'Legacy Import – Term <N>' where N is terms.term_number.

CREATE TEMP TABLE _legacy_activity_map (
  activity_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  class_id UUID NOT NULL,
  term_id UUID NOT NULL,
  academic_year_id UUID NOT NULL,
  teacher_id UUID NOT NULL
) ON COMMIT DROP;

WITH activity_groups AS (
  SELECT DISTINCT
    ac.tenant_id,
    ac.subject_id,
    st.class_id,
    ac.term_id,
    ac.academic_year_id,
    ac.teacher_id,
    t.term_number,
    t.start_date AS term_start_date
  FROM assessments_cbc ac
  JOIN students st ON st.id = ac.student_id
  JOIN terms t ON t.id = ac.term_id
  WHERE st.class_id IS NOT NULL
),
inserted AS (
  INSERT INTO assessment_activities (
    tenant_id,
    subject_id,
    class_id,
    term_id,
    academic_year_id,
    teacher_id,
    activity_type,
    title,
    activity_date
  )
  SELECT
    g.tenant_id,
    g.subject_id,
    g.class_id,
    g.term_id,
    g.academic_year_id,
    g.teacher_id,
    'test'::assessment_activity_type,
    'Legacy Import – Term ' || g.term_number::text,
    COALESCE(g.term_start_date, CURRENT_DATE)
  FROM activity_groups g
  RETURNING
    id,
    tenant_id,
    subject_id,
    class_id,
    term_id,
    academic_year_id,
    teacher_id
)
INSERT INTO _legacy_activity_map (
  activity_id,
  tenant_id,
  subject_id,
  class_id,
  term_id,
  academic_year_id,
  teacher_id
)
SELECT
  id,
  tenant_id,
  subject_id,
  class_id,
  term_id,
  academic_year_id,
  teacher_id
FROM inserted;

INSERT INTO competency_ratings (
  tenant_id,
  student_id,
  assessment_activity_id,
  competency_id,
  strand_id,
  competency_level,
  created_at
)
SELECT
  ac.tenant_id,
  ac.student_id,
  lam.activity_id,
  cc.id,
  strand_match.strand_row_id,
  ac.competency_level,
  COALESCE(ac.created_at, NOW())
FROM assessments_cbc ac
JOIN students st ON st.id = ac.student_id
JOIN _legacy_activity_map lam
  ON lam.tenant_id = ac.tenant_id
 AND lam.subject_id = ac.subject_id
 AND lam.class_id = st.class_id
 AND lam.term_id = ac.term_id
 AND lam.academic_year_id = ac.academic_year_id
 AND lam.teacher_id = ac.teacher_id
JOIN LATERAL (
  SELECT cs.id AS strand_row_id
  FROM cbc_strands cs
  WHERE cs.subject_id = ac.subject_id
    AND cs.tenant_id = ac.tenant_id
    AND (
      cs.name = ac.strand
      OR cs.strand_name = ac.strand
      OR lower(trim(cs.name)) = lower(trim(ac.strand))
      OR lower(trim(cs.strand_name)) = lower(trim(ac.strand))
    )
  ORDER BY cs.created_at NULLS LAST, cs.id
  LIMIT 1
) strand_match ON TRUE
JOIN cbc_competencies cc
  ON cc.strand_id = strand_match.strand_row_id
 AND cc.tenant_id = ac.tenant_id
 AND lower(trim(cc.name)) = lower(trim(ac.competency))
WHERE ac.competency_level IS NOT NULL
ON CONFLICT (student_id, assessment_activity_id, competency_id) DO NOTHING;

DO $$
DECLARE
  activity_count BIGINT;
  rating_inserted BIGINT;
  ac_eligible BIGINT;
  skipped_no_class BIGINT;
  unmatched_strand BIGINT;
  unmatched_competency BIGINT;
  unmatched_competency_sample TEXT;
BEGIN
  SELECT COUNT(*) INTO activity_count FROM _legacy_activity_map;

  SELECT COUNT(*) INTO rating_inserted
  FROM competency_ratings cr
  JOIN _legacy_activity_map lam ON lam.activity_id = cr.assessment_activity_id;

  SELECT COUNT(*) INTO ac_eligible
  FROM assessments_cbc ac
  WHERE ac.competency_level IS NOT NULL;

  SELECT COUNT(*) INTO skipped_no_class
  FROM assessments_cbc ac
  JOIN students st ON st.id = ac.student_id
  WHERE ac.competency_level IS NOT NULL
    AND st.class_id IS NULL;

  SELECT COUNT(DISTINCT ac.id) INTO unmatched_strand
  FROM assessments_cbc ac
  JOIN students st ON st.id = ac.student_id
  WHERE ac.competency_level IS NOT NULL
    AND st.class_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM cbc_strands cs
      WHERE cs.subject_id = ac.subject_id
        AND cs.tenant_id = ac.tenant_id
        AND (
          cs.name = ac.strand
          OR cs.strand_name = ac.strand
          OR lower(trim(cs.name)) = lower(trim(ac.strand))
          OR lower(trim(cs.strand_name)) = lower(trim(ac.strand))
        )
    );

  SELECT COUNT(DISTINCT ac.id) INTO unmatched_competency
  FROM assessments_cbc ac
  JOIN students st ON st.id = ac.student_id
  WHERE ac.competency_level IS NOT NULL
    AND st.class_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM cbc_strands cs
      WHERE cs.subject_id = ac.subject_id
        AND cs.tenant_id = ac.tenant_id
        AND (
          cs.name = ac.strand
          OR cs.strand_name = ac.strand
          OR lower(trim(cs.name)) = lower(trim(ac.strand))
          OR lower(trim(cs.strand_name)) = lower(trim(ac.strand))
        )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM cbc_strands cs
      JOIN cbc_competencies cc ON cc.strand_id = cs.id AND cc.tenant_id = ac.tenant_id
      WHERE cs.subject_id = ac.subject_id
        AND cs.tenant_id = ac.tenant_id
        AND (
          cs.name = ac.strand
          OR cs.strand_name = ac.strand
          OR lower(trim(cs.name)) = lower(trim(ac.strand))
          OR lower(trim(cs.strand_name)) = lower(trim(ac.strand))
        )
        AND lower(trim(cc.name)) = lower(trim(ac.competency))
    );

  SELECT string_agg(DISTINCT q.competency, ', ' ORDER BY q.competency)
  INTO unmatched_competency_sample
  FROM (
    SELECT DISTINCT ac.competency
    FROM assessments_cbc ac
    JOIN students st ON st.id = ac.student_id
    WHERE ac.competency_level IS NOT NULL
      AND st.class_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM cbc_strands cs
        WHERE cs.subject_id = ac.subject_id
          AND cs.tenant_id = ac.tenant_id
          AND (
            cs.name = ac.strand
            OR cs.strand_name = ac.strand
            OR lower(trim(cs.name)) = lower(trim(ac.strand))
            OR lower(trim(cs.strand_name)) = lower(trim(ac.strand))
          )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM cbc_strands cs
        JOIN cbc_competencies cc ON cc.strand_id = cs.id AND cc.tenant_id = ac.tenant_id
        WHERE cs.subject_id = ac.subject_id
          AND cs.tenant_id = ac.tenant_id
          AND (
            cs.name = ac.strand
            OR cs.strand_name = ac.strand
            OR lower(trim(cs.name)) = lower(trim(ac.strand))
            OR lower(trim(cs.strand_name)) = lower(trim(ac.strand))
          )
          AND lower(trim(cc.name)) = lower(trim(ac.competency))
      )
    LIMIT 50
  ) q;

  RAISE NOTICE '=== 073 synthetic legacy activities ===';
  RAISE NOTICE 'synthetic assessment_activities created: %', activity_count;
  RAISE NOTICE 'competency_ratings total rows (all sources): %', rating_inserted;
  RAISE NOTICE 'assessments_cbc rows with competency_level: %', ac_eligible;
  RAISE NOTICE 'skipped (student has no class_id): %', skipped_no_class;
  RAISE NOTICE 'assessments_cbc rows with unmatched strand: %', unmatched_strand;
  RAISE NOTICE 'assessments_cbc rows with strand but unmatched competency name: %', unmatched_competency;

  IF unmatched_competency_sample IS NOT NULL AND unmatched_competency_sample <> '' THEN
    RAISE NOTICE 'unmatched competency name sample (up to 50): %', unmatched_competency_sample;
  END IF;

  RAISE NOTICE 'cbc_strands.competencies JSONB column retained (not dropped in this migration).';
  RAISE NOTICE 'Legacy activity_type assumed as test — legacy rows did not record activity type.';
END $$;
