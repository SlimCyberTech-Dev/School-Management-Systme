# API integration tests

Jest security tests under `tests/security/` validate tenant isolation (PostgreSQL RLS), JWT, rate limiting, and input sanitisation. Some tests require a **local Postgres database** — they are not mocked.

## Expected test database

`tests/setup.ts` connects using (in order):

1. `apps/api/.env.test` (copy from `.env.test.example`)
2. Repo-root `.env.test`
3. Shell environment
4. Default: `postgresql://test:test@localhost:5432/school_manage_test`

Both pools must target the **same** test database:

- `DATABASE_URL_TEST` — tenant-scoped queries (`school_app`-like role, **no BYPASSRLS**)
- `PLATFORM_DATABASE_URL_TEST` — defaults to `DATABASE_URL_TEST` so Jest does not inherit `PLATFORM_DATABASE_URL` from `.env` (e.g. Render)

The `test` role must **not** have `BYPASSRLS` — otherwise `tenantIsolation.test.ts` would not detect cross-tenant leaks.

## One-time local setup (port 5432, team convention)

Prerequisites:

- PostgreSQL listening on `localhost:5432`
- `migration_admin` role already created (`npm run setup:db-roles` on local `school_manage` if needed)

From the repo root:

```bash
npm run setup:test-db --workspace=apps/api
```

This uses `sudo -u postgres` to:

1. Create role `test` / password `test`
2. Recreate database `school_manage_test` (owned by `migration_admin`)
3. Run all SQL migrations via `scripts/migrate-test-database.ts` (ignores remote `.env` URLs)
4. Grant `test` the same table access as `school_app`

Manual equivalent:

```bash
sudo -u postgres psql -v ON_ERROR_STOP=1 -f apps/api/scripts/sql/setup-test-database.sql
DATABASE_URL_MIGRATE=postgresql://migration_admin:change_me_migration@127.0.0.1:5432/school_manage_test \
  npx tsx apps/api/scripts/migrate-test-database.ts
PGPASSWORD=change_me_migration psql -h 127.0.0.1 -U migration_admin -d school_manage_test \
  -f apps/api/scripts/sql/grant-test-database.sql
```

If `sudo` is unavailable, set `LOCAL_DATABASE_SUPERUSER` to a superuser URL and re-run `setup:test-db`.

## Ephemeral Postgres fallback (port 5433)

When you cannot use `sudo` on the system Postgres instance, start a user-owned cluster in the repo (data in `.pg-test-data/`, gitignored):

```bash
PGDATA="$PWD/.pg-test-data" PG_BIN="/usr/lib/postgresql/18/bin" PORT=5433
rm -rf "$PGDATA"
"$PG_BIN/initdb" -D "$PGDATA" -U postgres --auth-local=trust --auth-host=trust -A trust
echo "unix_socket_directories = '$PGDATA'" >> "$PGDATA/postgresql.conf"
"$PG_BIN/pg_ctl" -D "$PGDATA" -o "-p $PORT -h 127.0.0.1 -k $PGDATA" -l "$PGDATA/server.log" start

psql -h 127.0.0.1 -p $PORT -U postgres -d postgres <<'SQL'
CREATE ROLE test LOGIN PASSWORD 'test';
CREATE DATABASE school_manage_test OWNER postgres;
GRANT CONNECT ON DATABASE school_manage_test TO test;
SQL

DATABASE_URL_MIGRATE="postgresql://postgres@127.0.0.1:5433/school_manage_test" \
  npx tsx apps/api/scripts/migrate-test-database.ts
psql -h 127.0.0.1 -p $PORT -U postgres -d school_manage_test \
  -f apps/api/scripts/sql/grant-test-database.sql
```

Copy `apps/api/.env.test.example` → `apps/api/.env.test` and set port **5433** (see committed `.env.test.example` for shape).

Stop ephemeral server: `"$PG_BIN/pg_ctl" -D "$PGDATA" stop`

## Running tests

```bash
cp apps/api/.env.test.example apps/api/.env.test   # after setup

npm run test:security --workspace=apps/api   # 8 security suites
npm run test --workspace=apps/api            # Jest (security + other *.test.ts)

npm run test:aggregation --workspace=apps/api    # Node test runner, no Postgres
npm run test:notifications --workspace=apps/api
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `password authentication failed for user "test"` | Run setup above |
| `migration_admin role missing` | `npm run setup:db-roles` on local `school_manage` first |
| FK errors / tenants missing in test DB | Ensure `PLATFORM_DATABASE_URL_TEST` is set (see `.env.test`) |
| `tenantIsolation` timeout in `beforeAll` | Postgres not reachable — start server / check port |
| Cross-tenant rows visible in SELECT test | **Real RLS bug** — report before changing app code |
