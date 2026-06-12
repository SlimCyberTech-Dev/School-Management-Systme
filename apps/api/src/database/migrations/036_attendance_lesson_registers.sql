-- Lesson-period attendance registers (linked to published timetable entries).

ALTER TABLE attendance_registers
  ADD COLUMN IF NOT EXISTS register_type VARCHAR(16) NOT NULL DEFAULT 'homeroom'
    CHECK (register_type IN ('homeroom', 'lesson')),
  ADD COLUMN IF NOT EXISTS timetable_entry_id UUID REFERENCES timetable_entries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES timetable_periods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS class_subject_id UUID REFERENCES class_subjects(id) ON DELETE SET NULL;

UPDATE attendance_registers
SET register_type = 'homeroom'
WHERE register_type IS NULL OR timetable_entry_id IS NULL;

ALTER TABLE attendance_registers DROP CONSTRAINT IF EXISTS attendance_registers_class_id_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_registers_homeroom_day
  ON attendance_registers (class_id, date)
  WHERE register_type = 'homeroom';

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_registers_lesson_day
  ON attendance_registers (timetable_entry_id, date)
  WHERE register_type = 'lesson' AND timetable_entry_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_registers_lesson_teacher
  ON attendance_registers (recorded_by, date)
  WHERE register_type = 'lesson';

ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_student_id_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_register
  ON attendance (student_id, register_id)
  WHERE register_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_date_legacy
  ON attendance (student_id, date)
  WHERE register_id IS NULL;
