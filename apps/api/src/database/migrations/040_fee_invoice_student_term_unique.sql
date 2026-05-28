-- One invoice per student per term (prevents duplicate billing).
CREATE UNIQUE INDEX IF NOT EXISTS fee_invoices_student_term_uidx
  ON fee_invoices (student_id, term_id);
