CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID REFERENCES academic_years(id),
  term_number INT NOT NULL CHECK (term_number IN (1,2,3)),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(10) NOT NULL,
  stream VARCHAR(20) NOT NULL,
  level VARCHAR(10) NOT NULL CHECK (level IN ('o_level', 'a_level')),
  academic_year_id UUID REFERENCES academic_years(id),
  class_teacher_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  level VARCHAR(10) NOT NULL CHECK (level IN ('o_level', 'a_level')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id),
  subject_id UUID REFERENCES subjects(id),
  teacher_id UUID REFERENCES users(id),
  UNIQUE(class_id, subject_id)
);

CREATE TABLE IF NOT EXISTS subject_combinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  subjects JSONB NOT NULL
);
