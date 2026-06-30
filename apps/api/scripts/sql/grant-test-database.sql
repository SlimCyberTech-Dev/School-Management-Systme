-- Grant test role application access on school_manage_test (run as migration_admin).
-- Mirrors school_app privileges from 051_db_roles.sql + 054_school_app_tenant_catalog.sql.

GRANT USAGE ON SCHEMA public TO test;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO test;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO test;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO test;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO test;

-- Catalog tables (no RLS) — subdomain / tenant resolution
GRANT SELECT ON tenants, tenant_domains TO test;
