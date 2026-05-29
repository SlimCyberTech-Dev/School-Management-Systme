# Tenant data isolation

School data is isolated by `tenant_id` on every row and **PostgreSQL Row Level Security (RLS)**. Each school signs in on its own subdomain (e.g. `greenhill.localhost:3000`).

## Why a new school saw another school's data

If `DATABASE_URL` uses the **`postgres` superuser** (or any role with `BYPASSRLS`), PostgreSQL **does not apply RLS**. The API still sets the correct tenant in the session, but queries return **all tenants' rows**.

## Fix (required for isolation)

### 1. Run migrations (includes role setup)

```bash
npm run migrate
```

Migration `051` creates `school_app`, `platform_app`, and `migration_admin`. Migration `054` grants catalog access to `school_app`.

### 2. Configure role passwords and update `.env`

```bash
npm run setup:db-roles
```

Use the printed URLs. Set in `.env`:

- `DATABASE_URL` → **`school_app`** (RLS enforced)
- `PLATFORM_DATABASE_URL` → **`platform_app`** (provisioning, bypasses RLS)
- `DATABASE_URL_MIGRATE` → **`migration_admin`** (migrations only)

Optional passwords in `.env` before setup:

- `SCHOOL_APP_PASSWORD`
- `PLATFORM_APP_PASSWORD`
- `MIGRATION_ADMIN_PASSWORD`

### 3. Restart the API

On startup the API logs a **warning** if the current DB role bypasses RLS.

### 4. Sign in on the correct school URL

Each school's staff must use **`http://{slug}.localhost:3000/login`**, not `default.localhost`, unless they belong to the default tenant.

After login, the JWT includes `tid` (tenant id) and `tsl` (slug). The web app redirects to the correct subdomain if needed.

## How isolation works

| Layer | Mechanism |
|-------|-----------|
| DNS / Host | `resolveTenant` → `req.tenant` from subdomain or `X-Tenant-Slug` |
| Login | `users` lookup scoped by `tenant_id` |
| JWT | `tid` + `tsl`; `requireAuth` rejects host/token mismatch |
| Request DB | `bindTenantContext` + `requireAuth` re-bind `app.tenant_id` from JWT |
| PostgreSQL | RLS policies on school tables (`052_enable_rls.sql`) |
| Queries | Critical paths also filter `tenant_id` explicitly (dashboard, users, students) |

## Verify

```bash
npm run test:security
```

Create two schools on the platform, seed users, sign in on each subdomain — each should see only its own students (empty for a new school).

## New school checklist

1. Platform → **Add school** (slug + admin email/password).
2. Open **`http://{slug}.localhost:3000/login`** (use **Copy sign-in URL** on platform).
3. Sign in as that school's admin — dashboard should show **0 students** until you add data.
