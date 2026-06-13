-- A-Level class track for automated subject provisioning (Sciences vs Arts).

ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS curriculum_track VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'classes'::regclass AND conname = 'classes_curriculum_track_check'
  ) THEN
    ALTER TABLE classes
      ADD CONSTRAINT classes_curriculum_track_check
      CHECK (curriculum_track IS NULL OR curriculum_track IN ('SCIENCES', 'ARTS', 'GENERAL'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_classes_curriculum_track
  ON classes (academic_year_id, level, curriculum_track)
  WHERE curriculum_track IS NOT NULL;

COMMENT ON COLUMN classes.curriculum_track IS
  'A-Level track for curriculum auto-provisioning: SCIENCES, ARTS, or GENERAL.';
