# Multi-tenant implementation phases

Living checklist for SchoolManage multi-tenancy. Update **Status** and **Notes** as work lands.

Related: [Rollback guide](multitenant-rollback.md) · [README](../README.md)

---

## Status overview

| Phase | Name | Status | Migration(s) |
|-------|------|--------|----------------|
| 0 | Backup & rollback | **Done** | — |
| 1 | Schema foundation | **Done** | `046`–`049` |
| 2 | Platform super-admin | **Done** | `050` |
| 3 | Subdomain + school auth | **Done** | — |
| 4 | PostgreSQL RLS | **Done** | `052` |
| 5 | Hardening & polish | **In progress** | `051` (optional, prod roles) |
| 6 | Production ops | **Not started** | — |

---

## Phase 0 — Backup & rollback

**Goal:** Safe rollback before schema changes.

**Deliverables**

- [x] `npm run backup:db` / `npm run restore:db`
- [x] [multitenant-rollback.md](multitenant-rollback.md)
- [x] Git tag `v1-single-tenant`
- [x] `backups/` in `.gitignore`

**Verify:** `backups/*.sql` non-empty after backup.

---

## Phase 1 — Schema foundation

**Goal:** `tenant_id` on all school data; `tenant_settings` replaces `school_settings`.

**Deliverables**

- [x] `tenants`, `tenant_domains`, `tenant_settings`
- [x] `tenant_id` column on tenant-scoped tables (`047`)
- [x] Default tenant backfill (`048`)
- [x] Composite uniques, NOT NULL, drop `school_settings` (`049`)
- [x] Seed creates default tenant + domain
- [x] Settings/reports read `tenant_settings`

**Key files**

- [apps/api/src/database/migrations/046_tenants_platform.sql](../apps/api/src/database/migrations/046_tenants_platform.sql)
- [apps/api/src/config/tenant.ts](../apps/api/src/config/tenant.ts)

**Verify:** `SELECT slug FROM tenants;` → `default`. No `school_settings` table.

---

## Phase 2 — Platform super-admin

**Goal:** Separate operators who create schools; school `admin` manages one tenant only.

**Deliverables**

- [x] `platform_admins` table
- [x] `/api/platform/auth/login`, `/api/platform/tenants` CRUD
- [x] Provision flow: tenant + domain + settings + first `admin` user
- [x] Platform JWT (`aud: platform`)
- [x] Web UI: `platform.localhost:3000` → `/platform/login`, `/platform/tenants`
- [x] `npm run seed:platform`

**Key files**

- [apps/api/src/modules/platform/](../apps/api/src/modules/platform/)
- [apps/web/src/app/platform/](../apps/web/src/app/platform/)

**Verify:** Create tenant `demo` on platform; open `http://demo.localhost:3000/login`.

---

## Phase 3 — Subdomain + school auth

**Goal:** Each school uses `{slug}.localhost` (or `{slug}.yourdomain.com`); JWT bound to tenant.

**Deliverables**

- [x] `resolveTenant` middleware (Host + `X-Tenant-Slug`)
- [x] `bindTenantContext` → `query()` sets `app.tenant_id` per request
- [x] JWT claim `tid`; `requireAuth` checks `tid` vs `req.tenant`
- [x] Login: `WHERE tenant_id = $1 AND email = $2`
- [x] CORS for `*.localhost` and `APP_ROOT_DOMAIN`
- [x] Web sends `X-Tenant-Slug`; middleware routes platform vs school
- [x] `authStore` persists `tenantSlug` / `tenantId` from login response
- [ ] **Remaining:** Remove `getDefaultTenantId()` fallbacks on authenticated routes (use `req.tenant.id` only)

**Key files**

- [apps/api/src/middleware/resolveTenant.ts](../apps/api/src/middleware/resolveTenant.ts)
- [apps/api/src/middleware/tenantContext.ts](../apps/api/src/middleware/tenantContext.ts)
- [apps/api/src/config/db.ts](../apps/api/src/config/db.ts) (`withTenant`, `tenantContext`)

**Verify:** Token from `default.localhost` rejected on `other.localhost` (401 `TENANT_MISMATCH`).

---

## Phase 4 — PostgreSQL RLS

**Goal:** DB enforces isolation even if app omits `WHERE tenant_id`.

**Deliverables**

- [x] `ENABLE` + `FORCE ROW LEVEL SECURITY` on tenant tables
- [x] Policy: `tenant_id = current_setting('app.tenant_id', true)::uuid`
- [x] `BEFORE INSERT` trigger: default `tenant_id` from session
- [x] `platformPool` for provisioning (superuser / BYPASSRLS in prod)
- [x] `migrate.ts` supports `DATABASE_URL_MIGRATE`
- [x] `npm run test:security` (JWT + tenant isolation; needs real `DATABASE_URL`)

**Key files**

- [apps/api/src/database/migrations/052_enable_rls.sql](../apps/api/src/database/migrations/052_enable_rls.sql)

**Verify:** With `set_config` set to tenant A, `SELECT` from `users` returns only tenant A rows.

---

## Phase 5 — Hardening & polish (in progress)

**Goal:** Production-ready isolation, storage, and UX.

**Deliverables**

- [x] `051_db_roles.sql` — `school_app`, `platform_app`, `migration_admin` (prod; change passwords after apply)
- [x] Tenant-scoped uploads: `uploads/{tenantId}/settings|students|users`
- [ ] Tenant-scoped report cache: `cache/reports/{tenantId}/` (helper added; wire report PDF cache writes)
- [ ] Pass `req.tenant.id` into reports/settings (drop silent default-tenant fallback in API handlers)
- [ ] Platform UI: edit tenant status/name, copy sign-in URL (partially done on list)
- [ ] `tenant_settings.feature_flags` usage (optional modules per school)
- [x] README + `.env.example` multi-tenant section
- [x] This phase document

**Key files to touch**

- [apps/api/src/utils/tenantUploads.ts](../apps/api/src/utils/tenantUploads.ts)
- Upload modules: `settings.upload.ts`, `students.upload.ts`, `users.upload.ts`
- [apps/web/src/store/authStore.ts](../apps/web/src/store/authStore.ts)

**Verify:** Two tenants’ logos stored under different `uploads/{uuid}/` paths; no cross-tenant file URL access.

---

## Phase 6 — Production ops (not started)

**Goal:** Operate many schools at scale.

**Backlog**

- [ ] Dedicated `PLATFORM_DATABASE_URL` with `BYPASSRLS` role (not superuser)
- [ ] Wildcard DNS `*.yourdomain.com` → app
- [ ] Per-tenant backup/export (`pg_dump` with tenant filter or logical export)
- [ ] Platform audit log (who created/suspended tenants)
- [ ] Rate limits per `tenant_id`
- [ ] Optional: custom domains table (`tenant_domains.custom_host`)
- [ ] Security review / pen test (cross-tenant IDOR, JWT, RLS bypass)

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | School API pool (subject to RLS in prod) |
| `PLATFORM_DATABASE_URL` | Platform provisioning (BYPASSRLS); defaults to `DATABASE_URL` in dev |
| `DATABASE_URL_MIGRATE` | Migration runner; defaults to `DATABASE_URL` |
| `APP_ROOT_DOMAIN` | `localhost` or production apex domain |
| `DEFAULT_TENANT_SLUG` | Fallback slug when Host is bare `localhost` |
| `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD` | `npm run seed:platform` |

---

## Local URLs

| URL | Role |
|-----|------|
| `http://default.localhost:3000` | Default school app |
| `http://{slug}.localhost:3000` | School by subdomain |
| `http://platform.localhost:3000` | Platform super-admin |
| `http://localhost:5000/api` | API |

---

## Implementation notes

1. **Do not** add `super_admin` to school `users` — use `platform_admins` only.
2. **Order:** Never enable RLS before `bindTenantContext` + login set `tid` (Phases 3–4 order matters).
3. **New tables** must include `tenant_id`, RLS policy, and insert trigger (copy pattern from `052`).
4. **New API routes** under `/api/*` (not `/api/platform`) must run after `resolveTenant` + `bindTenantContext`.
5. Update this doc when adding migration `053+`.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-29 | Initial doc; Phases 0–4 marked done; Phase 5 scoped |
| 2026-05-29 | Phase 5: tenant uploads, `051` roles migration, authStore tenant, `requestTenant` helper |
