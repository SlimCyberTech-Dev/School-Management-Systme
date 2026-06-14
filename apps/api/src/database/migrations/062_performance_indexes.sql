-- Performance indexes for student search and fee browsing at scale.
-- pg_trgm requires database-owner or superuser; other indexes apply without it.

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '062: skipping pg_trgm extension (insufficient privilege — ask DBA or run as postgres)';
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm')
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'full_name'
     ) THEN
    CREATE INDEX IF NOT EXISTS idx_students_full_name_trgm
      ON students USING gin (full_name gin_trgm_ops);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm')
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'student_number'
     ) THEN
    CREATE INDEX IF NOT EXISTS idx_students_student_number_trgm
      ON students USING gin (student_number gin_trgm_ops);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fee_invoices'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_fee_invoices_term_created
      ON fee_invoices (term_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_fee_invoices_open_balance
      ON fee_invoices (created_at DESC)
      WHERE balance > 0;
    CREATE INDEX IF NOT EXISTS idx_fee_invoices_flagged_open
      ON fee_invoices (created_at DESC)
      WHERE is_flagged AND balance > 0;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fee_payments'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_fee_payments_paid_at
      ON fee_payments (paid_at DESC);
  END IF;
END $$;
