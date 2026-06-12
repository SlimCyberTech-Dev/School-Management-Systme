-- Default tenant for existing single-school data; migrate school_settings → tenant_settings.

INSERT INTO tenants (slug, display_name, status)
VALUES ('default', 'Default School', 'active')
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  default_tid UUID;
BEGIN
  SELECT id INTO default_tid FROM tenants WHERE slug = 'default' LIMIT 1;

  INSERT INTO tenant_domains (tenant_id, subdomain, is_primary)
  VALUES (default_tid, 'default', TRUE)
  ON CONFLICT (subdomain) DO NOTHING;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'school_settings'
  ) THEN
    INSERT INTO tenant_settings (
      tenant_id,
      school_name,
      motto,
      vision,
      mission,
      logo_url,
      contact_email,
      contact_phone,
      website_url,
      postal_address,
      physical_address,
      primary_color,
      secondary_color,
      report_footer_text,
      report_layout
    )
    SELECT
      default_tid,
      school_name,
      motto,
      vision,
      mission,
      logo_url,
      contact_email,
      contact_phone,
      website_url,
      postal_address,
      physical_address,
      primary_color,
      secondary_color,
      report_footer_text,
      report_layout
    FROM school_settings
    WHERE singleton = TRUE
    ON CONFLICT (tenant_id) DO NOTHING;
  ELSE
    INSERT INTO tenant_settings (
      tenant_id,
      school_name,
      motto,
      primary_color,
      secondary_color,
      report_footer_text,
      report_layout
    )
    VALUES (
      default_tid,
      'Uganda CBC SMS School',
      'Learning with purpose',
      '#1D4ED8',
      '#0F172A',
      'This report is system-generated and valid without signature.',
      jsonb_build_object(
        'template', 'modern',
        'density', 'comfortable',
        'showStudentPhoto', true,
        'showTableStripes', true,
        'headerAlignment', 'left',
        'cornerRadius', 4,
        'baseFontSize', 9
      )
    )
    ON CONFLICT (tenant_id) DO NOTHING;
  END IF;

  UPDATE users SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE auth_sessions SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE password_reset_codes SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE email_verification_codes SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE academic_years SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE terms SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE classes SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE subjects SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE class_subjects SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE subject_combinations SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE combination_subjects SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE cbc_strands SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE cbc_sub_strands SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE class_teacher_assignments SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE teacher_subject_specializations SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE assessment_grading_scales SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE students SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE assessments_cbc SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE assessments_cbc_project SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE assessments_alevel SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE assessment_comments SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE assessment_alevel_comments SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE student_division_summary SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE alevel_scores SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE alevel_results SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE cbc_scores SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE cbc_report_cards SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE attendance SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE attendance_registers SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE fee_structures SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE fee_invoices SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE fee_payments SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE fee_schedule_releases SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE exams SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE exam_subjects SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE exam_subject_submissions SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE exam_marks SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE exam_student_entries SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE term_report_defaults SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE timetable_templates SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE timetable_periods SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE timetable_days SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE timetable_entries SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE timetable_publication_log SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE audit_logs SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE user_audit_logs SET tenant_id = default_tid WHERE tenant_id IS NULL;
  UPDATE _sequences SET tenant_id = default_tid WHERE tenant_id IS NULL;
END $$;
