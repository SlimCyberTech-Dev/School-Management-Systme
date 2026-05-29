-- NOT NULL tenant_id, composite uniques, per-tenant sequences PK, drop school_settings.

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'users', 'auth_sessions', 'password_reset_codes', 'email_verification_codes',
    'academic_years', 'terms', 'classes', 'subjects', 'class_subjects',
    'subject_combinations', 'combination_subjects', 'cbc_strands', 'cbc_sub_strands',
    'class_teacher_assignments', 'teacher_subject_specializations', 'assessment_grading_scales',
    'students', 'assessments_cbc', 'assessments_cbc_project', 'assessments_alevel',
    'assessment_comments', 'assessment_alevel_comments', 'student_division_summary',
    'alevel_scores', 'alevel_results', 'cbc_scores', 'cbc_report_cards',
    'attendance', 'attendance_registers',
    'fee_structures', 'fee_invoices', 'fee_payments', 'fee_schedule_releases',
    'exams', 'exam_subjects', 'exam_subject_submissions', 'exam_marks', 'exam_student_entries',
    'term_report_defaults',
    'timetable_templates', 'timetable_periods', 'timetable_days', 'timetable_entries',
    'timetable_publication_log', 'audit_logs', 'user_audit_logs', '_sequences'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'tenant_id'
    ) THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET NOT NULL', tbl);
    END IF;
  END LOOP;
END $$;

-- _sequences: composite primary key (tenant_id, name)
ALTER TABLE _sequences DROP CONSTRAINT IF EXISTS _sequences_pkey;
ALTER TABLE _sequences ADD PRIMARY KEY (tenant_id, name);

-- Drop global unique constraints / indexes (idempotent)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_email_uidx ON users (tenant_id, email);

ALTER TABLE students DROP CONSTRAINT IF EXISTS students_student_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS students_tenant_student_number_uidx ON students (tenant_id, student_number);

ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS subjects_tenant_code_uidx ON subjects (tenant_id, code);

ALTER TABLE subject_combinations DROP CONSTRAINT IF EXISTS subject_combinations_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS subject_combinations_tenant_code_uidx
  ON subject_combinations (tenant_id, code);

ALTER TABLE fee_payments DROP CONSTRAINT IF EXISTS fee_payments_receipt_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS fee_payments_tenant_receipt_uidx
  ON fee_payments (tenant_id, receipt_number);

ALTER TABLE auth_sessions DROP CONSTRAINT IF EXISTS auth_sessions_token_hash_key;
CREATE UNIQUE INDEX IF NOT EXISTS auth_sessions_tenant_token_hash_uidx
  ON auth_sessions (tenant_id, token_hash);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_students_tenant ON students (tenant_id);
CREATE INDEX IF NOT EXISTS idx_classes_tenant ON classes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_tenant ON academic_years (tenant_id);

DROP TABLE IF EXISTS school_settings;
