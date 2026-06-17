-- O-Level UCE certification status (Result 1 / 2 / 3).

CREATE TABLE IF NOT EXISTS olevel_certification_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  result_code VARCHAR(20) NOT NULL CHECK (result_code IN ('RESULT_1', 'RESULT_2', 'RESULT_3')),
  reason_codes TEXT[] NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, student_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_olevel_cert_student_year
  ON olevel_certification_status (student_id, academic_year_id);

ALTER TABLE olevel_certification_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE olevel_certification_status FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_olevel_certification_status ON olevel_certification_status;
CREATE POLICY tenant_isolation_olevel_certification_status ON olevel_certification_status
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

DROP TRIGGER IF EXISTS trg_olevel_certification_status_tenant_default ON olevel_certification_status;
CREATE TRIGGER trg_olevel_certification_status_tenant_default
  BEFORE INSERT ON olevel_certification_status
  FOR EACH ROW EXECUTE FUNCTION apply_tenant_id_default();
