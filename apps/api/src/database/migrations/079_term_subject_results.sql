-- Term-scoped subject grades: mean of compulsory exam marks (+ optional project work blend).

CREATE TABLE IF NOT EXISTS term_subject_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  exam_average NUMERIC(5,2),
  project_average NUMERIC(5,2),
  composite_score NUMERIC(5,2),
  final_grade CHAR(1) CHECK (final_grade IN ('A', 'B', 'C', 'D', 'E')),
  exam_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects_completed INT NOT NULL DEFAULT 0,
  projects_expected INT NOT NULL DEFAULT 0,
  include_project_work BOOLEAN NOT NULL DEFAULT TRUE,
  formula_version VARCHAR(40) NOT NULL DEFAULT 'term_exam_avg_v1',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, student_id, subject_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_term_subject_results_class_term
  ON term_subject_results (term_id, student_id);

CREATE INDEX IF NOT EXISTS idx_term_subject_results_student_term
  ON term_subject_results (student_id, term_id);

ALTER TABLE term_subject_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_subject_results FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_term_subject_results ON term_subject_results;
CREATE POLICY tenant_isolation_term_subject_results ON term_subject_results
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

DROP TRIGGER IF EXISTS trg_term_subject_results_tenant_default ON term_subject_results;
CREATE TRIGGER trg_term_subject_results_tenant_default
  BEFORE INSERT ON term_subject_results
  FOR EACH ROW EXECUTE FUNCTION apply_tenant_id_default();
