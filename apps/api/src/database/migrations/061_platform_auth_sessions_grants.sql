-- platform_auth_sessions was added after initial role grants; platform_app needs access.
GRANT SELECT, INSERT, UPDATE ON platform_auth_sessions TO platform_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON platform_auth_sessions TO migration_admin;
