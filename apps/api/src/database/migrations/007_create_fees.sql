CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id),
  term_id UUID REFERENCES terms(id),
  category VARCHAR(100) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, term_id, category)
);

CREATE TABLE IF NOT EXISTS fee_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  term_id UUID REFERENCES terms(id),
  total_amount NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  balance NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES fee_invoices(id),
  student_id UUID REFERENCES students(id),
  amount NUMERIC(12,2) NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('cash','mobile_money')),
  transaction_ref VARCHAR(100),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  recorded_by UUID REFERENCES users(id),
  paid_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
