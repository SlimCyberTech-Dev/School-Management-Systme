-- Scope OTP active-email uniqueness per tenant (was global on email only in 010).
-- Allows the same email to have active reset/verification codes in different schools.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM password_reset_codes
    WHERE tenant_id IS NULL
      AND used_at IS NULL
      AND expires_at > NOW()
  ) THEN
    RAISE EXCEPTION
      'password_reset_codes: active rows with NULL tenant_id exist — backfill tenant_id before applying this migration';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM email_verification_codes
    WHERE tenant_id IS NULL
      AND used_at IS NULL
      AND expires_at > NOW()
  ) THEN
    RAISE EXCEPTION
      'email_verification_codes: active rows with NULL tenant_id exist — backfill tenant_id before applying this migration';
  END IF;
END $$;

DROP INDEX IF EXISTS uq_password_reset_codes_active_email;
CREATE UNIQUE INDEX uq_password_reset_codes_active_email
  ON password_reset_codes (tenant_id, email)
  WHERE used_at IS NULL;

DROP INDEX IF EXISTS uq_email_verification_codes_active_email;
CREATE UNIQUE INDEX uq_email_verification_codes_active_email
  ON email_verification_codes (tenant_id, email)
  WHERE used_at IS NULL;
