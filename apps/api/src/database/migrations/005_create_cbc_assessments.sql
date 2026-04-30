CREATE TABLE IF NOT EXISTS cbc_strands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id),
  strand_name VARCHAR(100) NOT NULL,
  competencies JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS cbc_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  subject_id UUID REFERENCES subjects(id),
  strand_id UUID REFERENCES cbc_strands(id),
  term_id UUID REFERENCES terms(id),
  competency VARCHAR(255) NOT NULL,
  rating CHAR(1) NOT NULL CHECK (rating IN ('A','B','C','D')),
  submitted BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP,
  teacher_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, subject_id, strand_id, competency, term_id)
);

CREATE TABLE IF NOT EXISTS cbc_report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  term_id UUID REFERENCES terms(id),
  teacher_comment TEXT,
  headteacher_comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
