CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_number VARCHAR(30) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  guardian_name VARCHAR(255) NOT NULL,
  guardian_contact VARCHAR(20) NOT NULL,
  class_id UUID REFERENCES classes(id),
  combination_id UUID REFERENCES subject_combinations(id),
  photo_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active' CHECK
    (status IN ('active', 'transferred', 'withdrawn')),
  transfer_reason TEXT,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
