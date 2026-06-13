-- Transfer application objects in public schema to migration_admin.
-- Run as PostgreSQL superuser. Do NOT use REASSIGN OWNED BY postgres (includes system objects).

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO migration_admin', r.tablename);
  END LOOP;

  FOR r IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO migration_admin', r.sequencename);
  END LOOP;

  FOR r IN SELECT viewname FROM pg_views WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER VIEW public.%I OWNER TO migration_admin', r.viewname);
  END LOOP;

  FOR r IN SELECT matviewname FROM pg_matviews WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'ALTER MATERIALIZED VIEW public.%I OWNER TO migration_admin',
      r.matviewname
    );
  END LOOP;
END $$;

ALTER SCHEMA public OWNER TO migration_admin;
