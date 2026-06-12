-- Row-level security: tenant isolation enforced in PostgreSQL.

CREATE OR REPLACE FUNCTION apply_tenant_id_default()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
  END IF;
  RETURN NEW;
END;
$$;

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
  pol_name TEXT;
  trg_name TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      CONTINUE;
    END IF;

    trg_name := 'trg_' || tbl || '_tenant_default';
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trg_name, tbl);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT ON %I
       FOR EACH ROW EXECUTE FUNCTION apply_tenant_id_default()',
      trg_name,
      tbl
    );

    pol_name := 'tenant_isolation_' || tbl;
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol_name, tbl);
    EXECUTE format(
      'CREATE POLICY %I ON %I
       FOR ALL
       USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)
       WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)',
      pol_name,
      tbl
    );
  END LOOP;
END $$;
