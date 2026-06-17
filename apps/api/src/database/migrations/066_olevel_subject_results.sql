-- Per-subject O-Level composite results (CA 20% + EOC 80%).

CREATE TABLE IF NOT EXISTS olevel_subject_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  ca_score NUMERIC(5,2),
  eoc_score NUMERIC(5,2),
  composite_score NUMERIC(5,2),
  final_grade CHAR(1) CHECK (final_grade IN ('A', 'B', 'C', 'D', 'E')),
  ca_complete BOOLEAN NOT NULL DEFAULT FALSE,
  project_complete BOOLEAN NOT NULL DEFAULT FALSE,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, student_id, subject_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_olevel_subject_results_student_year
  ON olevel_subject_results (student_id, academic_year_id);

ALTER TABLE olevel_subject_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE olevel_subject_results FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_olevel_subject_results ON olevel_subject_results;
CREATE POLICY tenant_isolation_olevel_subject_results ON olevel_subject_results
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

DROP TRIGGER IF EXISTS trg_olevel_subject_results_tenant_default ON olevel_subject_results;
CREATE TRIGGER trg_olevel_subject_results_tenant_default
  BEFORE INSERT ON olevel_subject_results
  FOR EACH ROW EXECUTE FUNCTION apply_tenant_id_default();

-- Project work lifecycle (separate from CA score).
ALTER TABLE assessments_cbc_project
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'recorded'
    CHECK (status IN ('recorded', 'verified', 'incomplete')),
  ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN NOT NULL DEFAULT TRUE;
