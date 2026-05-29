-- Allow school_app to resolve tenants by subdomain (catalog tables have no RLS).
GRANT SELECT ON tenants, tenant_domains TO school_app;
