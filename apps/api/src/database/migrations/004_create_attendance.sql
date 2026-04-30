CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  class_id UUID REFERENCES classes(id),
  date DATE NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('present','absent','late')),
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, date)
);
