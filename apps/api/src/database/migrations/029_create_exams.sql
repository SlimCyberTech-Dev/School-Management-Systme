CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  exam_date DATE,
  max_score NUMERIC(6,2) NOT NULL DEFAULT 100 CHECK (max_score > 0 AND max_score <= 1000),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE (exam_id, subject_id)
);

CREATE TABLE IF NOT EXISTS exam_subject_submissions (
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (exam_id, subject_id)
);

CREATE TABLE IF NOT EXISTS exam_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  score NUMERIC(6,2) NOT NULL CHECK (score >= 0),
  grade VARCHAR(4),
  points INTEGER,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (exam_id, student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_exams_year_term ON exams (academic_year_id, term_id);
CREATE INDEX IF NOT EXISTS idx_exams_class ON exams (class_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams (status);
CREATE INDEX IF NOT EXISTS idx_exam_marks_exam_subject ON exam_marks (exam_id, subject_id);
