-- Backfill class_teacher_assignments from legacy classes.class_teacher_id (idempotent).
-- Keeps classes.class_teacher_id as a synced cache via application syncHomeroomOnClass.

INSERT INTO class_teacher_assignments (tenant_id, class_id, teacher_id, academic_year_id, is_homeroom)
SELECT c.tenant_id, c.id, c.class_teacher_id, c.academic_year_id, true
FROM classes c
WHERE c.class_teacher_id IS NOT NULL
  AND c.academic_year_id IS NOT NULL
ON CONFLICT (class_id, teacher_id, academic_year_id) DO UPDATE SET is_homeroom = true;

-- Repair cache column from canonical assignments where legacy was stale or null.
UPDATE classes c
SET class_teacher_id = cta.teacher_id
FROM class_teacher_assignments cta
WHERE cta.class_id = c.id
  AND cta.academic_year_id = c.academic_year_id
  AND cta.is_homeroom = true
  AND (c.class_teacher_id IS DISTINCT FROM cta.teacher_id);
