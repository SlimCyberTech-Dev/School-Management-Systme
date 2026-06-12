CREATE TABLE IF NOT EXISTS alevel_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  subject_id UUID REFERENCES subjects(id),
  term_id UUID REFERENCES terms(id),
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  grade VARCHAR(2),
  points INT,
  teacher_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, subject_id, term_id)
);

CREATE TABLE IF NOT EXISTS alevel_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  term_id UUID REFERENCES terms(id),
  total_points INT,
  division VARCHAR(20),
  teacher_comment TEXT,
  headteacher_remark TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
