-- Optional demographic / guardian contact fields for enrollment records.
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS guardian_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS previous_school VARCHAR(255);
