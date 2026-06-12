ALTER TABLE school_settings
ADD COLUMN IF NOT EXISTS report_layout JSONB;

UPDATE school_settings
SET report_layout = COALESCE(
  report_layout,
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
WHERE singleton = TRUE;
