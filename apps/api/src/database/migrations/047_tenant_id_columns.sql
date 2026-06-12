-- Add nullable tenant_id to all tenant-scoped tables (backfilled in 048).

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'users',
    'auth_sessions',
    'password_reset_codes',
    'email_verification_codes',
    'academic_years',
    'terms',
    'classes',
    'subjects',
    'class_subjects',
    'subject_combinations',
    'combination_subjects',
    'cbc_strands',
    'cbc_sub_strands',
    'class_teacher_assignments',
    'teacher_subject_specializations',
    'assessment_grading_scales',
    'students',
    'assessments_cbc',
    'assessments_cbc_project',
    'assessments_alevel',
    'assessment_comments',
    'assessment_alevel_comments',
    'student_division_summary',
    'alevel_scores',
    'alevel_results',
    'cbc_scores',
    'cbc_report_cards',
    'attendance',
    'attendance_registers',
    'fee_structures',
    'fee_invoices',
    'fee_payments',
    'fee_schedule_releases',
    'exams',
    'exam_subjects',
    'exam_subject_submissions',
    'exam_marks',
    'exam_student_entries',
    'term_report_defaults',
    'timetable_templates',
    'timetable_periods',
    'timetable_days',
    'timetable_entries',
    'timetable_publication_log',
    'audit_logs',
    'user_audit_logs',
    '_sequences'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)',
        tbl
      );
    END IF;
  END LOOP;
END $$;
