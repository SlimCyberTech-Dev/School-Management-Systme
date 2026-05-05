-- Instructional structure expansion (safe to rerun)

-- Replace old lowercase level checks with uppercase enum checks.
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'classes'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%level%'
  LOOP
    EXECUTE format('ALTER TABLE classes DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'subjects'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%level%'
  LOOP
    EXECUTE format('ALTER TABLE subjects DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

-- Canonicalize legacy lowercase levels used in existing data.
UPDATE classes
SET level = CASE level WHEN 'o_level' THEN 'O_LEVEL' WHEN 'a_level' THEN 'A_LEVEL' ELSE level END
WHERE level IN ('o_level', 'a_level');
UPDATE classes
SET level = 'O_LEVEL'
WHERE level IS NULL OR level NOT IN ('O_LEVEL', 'A_LEVEL');

UPDATE subjects
SET level = CASE level WHEN 'o_level' THEN 'O_LEVEL' WHEN 'a_level' THEN 'A_LEVEL' ELSE level END
WHERE level IN ('o_level', 'a_level');
UPDATE subjects
SET level = 'O_LEVEL'
WHERE level IS NULL OR level NOT IN ('O_LEVEL', 'A_LEVEL');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'subject_combinations'
      AND column_name = 'level'
  ) THEN
    EXECUTE $sql$
      UPDATE subject_combinations
      SET level = CASE level WHEN 'o_level' THEN 'O_LEVEL' WHEN 'a_level' THEN 'A_LEVEL' ELSE level END
      WHERE level IN ('o_level', 'a_level')
    $sql$;
    EXECUTE $sql$
      UPDATE subject_combinations
      SET level = 'A_LEVEL'
      WHERE level IS NULL OR level NOT IN ('O_LEVEL', 'A_LEVEL')
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'classes'::regclass AND conname = 'classes_level_check_upper'
  ) THEN
    ALTER TABLE classes
      ADD CONSTRAINT classes_level_check_upper CHECK (level IN ('O_LEVEL', 'A_LEVEL'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'subjects'::regclass AND conname = 'subjects_level_check_upper'
  ) THEN
    ALTER TABLE subjects
      ADD CONSTRAINT subjects_level_check_upper CHECK (level IN ('O_LEVEL', 'A_LEVEL'));
  END IF;
END $$;

-- class_subjects enhancements.
CREATE TABLE IF NOT EXISTS class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL
);

DO $$ BEGIN
  ALTER TABLE class_subjects ADD COLUMN academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE class_subjects ADD COLUMN term_id UUID REFERENCES terms(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE class_subjects ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE class_subjects ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- backfill academic year for existing assignment rows.
UPDATE class_subjects cs
SET academic_year_id = c.academic_year_id
FROM classes c
WHERE cs.class_id = c.id
  AND cs.academic_year_id IS NULL;

DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'class_subjects'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%class_id%'
      AND pg_get_constraintdef(oid) ILIKE '%subject_id%'
  LOOP
    EXECUTE format('ALTER TABLE class_subjects DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'class_subjects'::regclass
      AND conname = 'class_subjects_class_subject_year_unique'
  ) THEN
    ALTER TABLE class_subjects
      ADD CONSTRAINT class_subjects_class_subject_year_unique
      UNIQUE (class_id, subject_id, academic_year_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_class_subjects_class_id ON class_subjects (class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON class_subjects (subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher_id ON class_subjects (teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_academic_year_id ON class_subjects (academic_year_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_term_id ON class_subjects (term_id);

-- subject_combinations enhancements.
CREATE TABLE IF NOT EXISTS subject_combinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('O_LEVEL', 'A_LEVEL')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE subject_combinations ADD COLUMN description TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE subject_combinations ADD COLUMN level VARCHAR(20);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE subject_combinations ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE subject_combinations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- infer combination level when legacy rows exist.
UPDATE subject_combinations
SET level = COALESCE(level, 'A_LEVEL')
WHERE level IS NULL;

DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'subject_combinations'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%level%'
  LOOP
    EXECUTE format('ALTER TABLE subject_combinations DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'subject_combinations'::regclass
      AND conname = 'subject_combinations_level_check_upper'
  ) THEN
    ALTER TABLE subject_combinations
      ADD CONSTRAINT subject_combinations_level_check_upper
      CHECK (level IN ('O_LEVEL', 'A_LEVEL'));
  END IF;
END $$;

ALTER TABLE subject_combinations
  ALTER COLUMN level SET NOT NULL;

-- normalized combination-subject relationship.
CREATE TABLE IF NOT EXISTS combination_subjects (
  combination_id UUID REFERENCES subject_combinations(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (combination_id, subject_id)
);

-- backfill from legacy subject_combinations.subjects jsonb array.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'subject_combinations'
      AND column_name = 'subjects'
  ) THEN
    INSERT INTO combination_subjects (combination_id, subject_id)
    SELECT sc.id, s.id
    FROM subject_combinations sc
    CROSS JOIN LATERAL jsonb_array_elements_text(sc.subjects) subj(val)
    JOIN subjects s
      ON s.id::text = subj.val
      OR UPPER(s.code) = UPPER(subj.val)
      OR UPPER(s.name) = UPPER(subj.val)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_combination_subjects_combination_id ON combination_subjects (combination_id);
CREATE INDEX IF NOT EXISTS idx_combination_subjects_subject_id ON combination_subjects (subject_id);

-- cbc strands + sub-strands.
CREATE TABLE IF NOT EXISTS cbc_strands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE cbc_strands ADD COLUMN name VARCHAR(100);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE cbc_strands ADD COLUMN code VARCHAR(20);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE cbc_strands ADD COLUMN description TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE cbc_strands ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE cbc_strands ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'cbc_strands'
      AND column_name = 'strand_name'
  ) THEN
    UPDATE cbc_strands
    SET name = COALESCE(name, strand_name)
    WHERE name IS NULL;
  END IF;
END $$;

UPDATE cbc_strands
SET code = COALESCE(code, UPPER(REPLACE(REGEXP_REPLACE(name, '[^A-Za-z0-9]+', '_', 'g'), '__', '_')))
WHERE code IS NULL AND name IS NOT NULL;

UPDATE cbc_strands
SET name = COALESCE(name, 'Untitled Strand'),
    code = COALESCE(code, 'STRAND')
WHERE name IS NULL OR code IS NULL;

ALTER TABLE cbc_strands
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN code SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'cbc_strands'::regclass
      AND conname = 'cbc_strands_code_subject_unique'
  ) THEN
    ALTER TABLE cbc_strands
      ADD CONSTRAINT cbc_strands_code_subject_unique UNIQUE (code, subject_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cbc_strands_subject_id ON cbc_strands (subject_id);

CREATE TABLE IF NOT EXISTS cbc_sub_strands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strand_id UUID REFERENCES cbc_strands(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbc_sub_strands_strand_id ON cbc_sub_strands (strand_id);
