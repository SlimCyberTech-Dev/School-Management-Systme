-- NCDC 4-level competency descriptor scale: enums, normalized competencies, activity-linked ratings.
-- Phase 1: schema only — competency_level columns on legacy tables are nullable until 072 backfill.

DO $$ BEGIN
  CREATE TYPE competency_level AS ENUM (
    'exceeds_expectations',
    'meets_expectations',
    'approaching_expectations',
    'below_expectations'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE assessment_activity_type AS ENUM (
    'assignment',
    'project',
    'group_work',
    'practical',
    'participation',
    'presentation',
    'test'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE competency_level IS
  'NCDC O-Level competency descriptors. Sort/aggregate rank via competency_level_rank() — never expose rank in UI.';

-- Internal rank for ORDER BY / aggregation only (4=highest, 1=lowest). Not a stored column.
CREATE OR REPLACE FUNCTION competency_level_rank(level competency_level)
RETURNS SMALLINT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE level
    WHEN 'exceeds_expectations'::competency_level THEN 4::smallint
    WHEN 'meets_expectations'::competency_level THEN 3::smallint
    WHEN 'approaching_expectations'::competency_level THEN 2::smallint
    WHEN 'below_expectations'::competency_level THEN 1::smallint
  END;
$$;

COMMENT ON FUNCTION competency_level_rank(competency_level) IS
  'Private sort/aggregation helper for competency_level. Do not expose rank to API or UI.';

CREATE TABLE IF NOT EXISTS cbc_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strand_id UUID NOT NULL REFERENCES cbc_strands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS cbc_competencies_tenant_strand_name_norm_uidx
  ON cbc_competencies (tenant_id, strand_id, lower(trim(name)));

CREATE INDEX IF NOT EXISTS idx_cbc_competencies_strand_id ON cbc_competencies (strand_id);
CREATE INDEX IF NOT EXISTS idx_cbc_competencies_tenant_id ON cbc_competencies (tenant_id);

-- Seed from cbc_strands.competencies JSONB (dedupe by normalized name within strand).
INSERT INTO cbc_competencies (strand_id, name, tenant_id)
SELECT DISTINCT ON (s.id, lower(trim(elem.val)))
  s.id,
  trim(elem.val),
  s.tenant_id
FROM cbc_strands s
CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(s.competencies, '[]'::jsonb)) AS elem(val)
WHERE trim(elem.val) <> ''
ORDER BY s.id, lower(trim(elem.val)), trim(elem.val)
ON CONFLICT DO NOTHING;

ALTER TABLE cbc_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbc_competencies FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_cbc_competencies ON cbc_competencies;
CREATE POLICY tenant_isolation_cbc_competencies ON cbc_competencies
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

DROP TRIGGER IF EXISTS trg_cbc_competencies_tenant_default ON cbc_competencies;
CREATE TRIGGER trg_cbc_competencies_tenant_default
  BEFORE INSERT ON cbc_competencies
  FOR EACH ROW EXECUTE FUNCTION apply_tenant_id_default();

CREATE TABLE IF NOT EXISTS assessment_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  activity_type assessment_activity_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  activity_date DATE NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_activities_class_term
  ON assessment_activities (class_id, term_id);
CREATE INDEX IF NOT EXISTS idx_assessment_activities_subject_term
  ON assessment_activities (subject_id, term_id);
CREATE INDEX IF NOT EXISTS idx_assessment_activities_teacher_id
  ON assessment_activities (teacher_id);

ALTER TABLE assessment_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_activities FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_assessment_activities ON assessment_activities;
CREATE POLICY tenant_isolation_assessment_activities ON assessment_activities
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

DROP TRIGGER IF EXISTS trg_assessment_activities_tenant_default ON assessment_activities;
CREATE TRIGGER trg_assessment_activities_tenant_default
  BEFORE INSERT ON assessment_activities
  FOR EACH ROW EXECUTE FUNCTION apply_tenant_id_default();

CREATE TABLE IF NOT EXISTS competency_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessment_activity_id UUID NOT NULL REFERENCES assessment_activities(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES cbc_competencies(id) ON DELETE CASCADE,
  strand_id UUID NOT NULL REFERENCES cbc_strands(id) ON DELETE CASCADE,
  competency_level competency_level NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, assessment_activity_id, competency_id)
);

CREATE INDEX IF NOT EXISTS idx_competency_ratings_student_id ON competency_ratings (student_id);
CREATE INDEX IF NOT EXISTS idx_competency_ratings_activity_id ON competency_ratings (assessment_activity_id);
CREATE INDEX IF NOT EXISTS idx_competency_ratings_competency_id ON competency_ratings (competency_id);

ALTER TABLE competency_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_ratings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_competency_ratings ON competency_ratings;
CREATE POLICY tenant_isolation_competency_ratings ON competency_ratings
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

DROP TRIGGER IF EXISTS trg_competency_ratings_tenant_default ON competency_ratings;
CREATE TRIGGER trg_competency_ratings_tenant_default
  BEFORE INSERT ON competency_ratings
  FOR EACH ROW EXECUTE FUNCTION apply_tenant_id_default();

CREATE TABLE IF NOT EXISTS learning_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  strand_id UUID NOT NULL REFERENCES cbc_strands(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_outcomes_subject_term
  ON learning_outcomes (subject_id, term_id);

ALTER TABLE learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_outcomes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_learning_outcomes ON learning_outcomes;
CREATE POLICY tenant_isolation_learning_outcomes ON learning_outcomes
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

DROP TRIGGER IF EXISTS trg_learning_outcomes_tenant_default ON learning_outcomes;
CREATE TRIGGER trg_learning_outcomes_tenant_default
  BEFORE INSERT ON learning_outcomes
  FOR EACH ROW EXECUTE FUNCTION apply_tenant_id_default();

CREATE TABLE IF NOT EXISTS learning_outcome_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  learning_outcome_id UUID NOT NULL REFERENCES learning_outcomes(id) ON DELETE CASCADE,
  achievement_level competency_level NOT NULL,
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_outcome_records_student_id
  ON learning_outcome_records (student_id);
CREATE INDEX IF NOT EXISTS idx_learning_outcome_records_outcome_id
  ON learning_outcome_records (learning_outcome_id);

ALTER TABLE learning_outcome_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_outcome_records FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_learning_outcome_records ON learning_outcome_records;
CREATE POLICY tenant_isolation_learning_outcome_records ON learning_outcome_records
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

DROP TRIGGER IF EXISTS trg_learning_outcome_records_tenant_default ON learning_outcome_records;
CREATE TRIGGER trg_learning_outcome_records_tenant_default
  BEFORE INSERT ON learning_outcome_records
  FOR EACH ROW EXECUTE FUNCTION apply_tenant_id_default();

CREATE TABLE IF NOT EXISTS term_competency_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES cbc_competencies(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  aggregated_level competency_level NOT NULL,
  aggregation_method VARCHAR(20) NOT NULL DEFAULT 'most_frequent',
  is_teacher_override BOOLEAN NOT NULL DEFAULT FALSE,
  overridden_level competency_level,
  override_justification TEXT,
  overridden_by UUID REFERENCES users(id) ON DELETE SET NULL,
  overridden_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, subject_id, competency_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_term_competency_summary_student_term
  ON term_competency_summary (student_id, term_id);

ALTER TABLE term_competency_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_competency_summary FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_term_competency_summary ON term_competency_summary;
CREATE POLICY tenant_isolation_term_competency_summary ON term_competency_summary
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

DROP TRIGGER IF EXISTS trg_term_competency_summary_tenant_default ON term_competency_summary;
CREATE TRIGGER trg_term_competency_summary_tenant_default
  BEFORE INSERT ON term_competency_summary
  FOR EACH ROW EXECUTE FUNCTION apply_tenant_id_default();

-- Nullable until 072 backfill; rating column retained for dual-write phase.
ALTER TABLE assessments_cbc
  ADD COLUMN IF NOT EXISTS competency_level competency_level;

ALTER TABLE cbc_scores
  ADD COLUMN IF NOT EXISTS competency_level competency_level;

COMMENT ON COLUMN assessments_cbc.competency_level IS
  'NCDC 4-level descriptor; backfilled from rating in 072. rating column dropped in a later migration.';
COMMENT ON COLUMN cbc_scores.competency_level IS
  'NCDC 4-level descriptor; kept in sync with assessments_cbc via application dual-write.';
