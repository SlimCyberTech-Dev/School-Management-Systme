-- Publish / bill workflow per class and term (separate from fee category rows).
CREATE TABLE IF NOT EXISTS fee_schedule_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'billed')),
  published_at TIMESTAMP,
  published_by UUID REFERENCES users(id),
  billed_at TIMESTAMP,
  billed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (class_id, term_id)
);

CREATE INDEX IF NOT EXISTS fee_schedule_releases_term_idx ON fee_schedule_releases (term_id);

-- Backfill releases for existing fee structures (grandfather as published when not yet billed).
INSERT INTO fee_schedule_releases (class_id, term_id, status)
SELECT DISTINCT fs.class_id, fs.term_id,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM fee_invoices fi
      JOIN students s ON s.id = fi.student_id
      WHERE s.class_id = fs.class_id AND fi.term_id = fs.term_id
    ) THEN 'billed'
    ELSE 'published'
  END
FROM fee_structures fs
ON CONFLICT (class_id, term_id) DO NOTHING;
