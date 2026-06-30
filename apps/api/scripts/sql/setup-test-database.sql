-- Bootstrap local integration-test database for Jest security tests.
-- Run as PostgreSQL superuser: sudo -u postgres psql -v ON_ERROR_STOP=1 -f apps/api/scripts/sql/setup-test-database.sql
--
-- Creates role `test` / password `test` (RLS-enforced, no BYPASSRLS) and database
-- `school_manage_test`, owned by migration_admin for migrations.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test') THEN
    CREATE ROLE test LOGIN PASSWORD 'test';
  ELSE
    ALTER ROLE test WITH LOGIN PASSWORD 'test';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'migration_admin') THEN
    RAISE EXCEPTION 'migration_admin role missing. Run npm run setup:db-roles on school_manage first.';
  END IF;
END $$;

SELECT pg_catalog.pg_terminate_backend(pid)
FROM pg_catalog.pg_stat_activity
WHERE datname = 'school_manage_test' AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS school_manage_test;
CREATE DATABASE school_manage_test OWNER migration_admin;

GRANT CONNECT ON DATABASE school_manage_test TO test;
GRANT CONNECT ON DATABASE school_manage_test TO migration_admin;
