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
| 5 | Hardening & polish | **Done** | `051`, `053` |
| 6 | Isolation enforcement | **Done** | `054`, `setup:db-roles` |
| 7 | Production ops | **Backlog** | — |

---

## Phase 0 — Backup & rollback

**Goal:** Safe rollback before schema changes.

**Deliverables**

- [x] `npm run backup:db` / `npm run restore:db`
- [x] [multitenant-rollback.md](multitenant-rollback.md)
- [x] Git tag `v1-single-tenant`
- [x] `backups/` in `.gitignore`

---

## Phase 1 — Schema foundation

**Goal:** `tenant_id` on all school data; `tenant_settings` replaces `school_settings`.

**Deliverables:** All complete — see migration `046`–`049`.

---

## Phase 2 — Platform super-admin

**Goal:** Separate operators who create schools.

**Deliverables:** All complete — `/api/platform/*`, web UI at `platform.localhost`.

---

## Phase 3 — Subdomain + school auth

**Goal:** `{slug}.localhost` + JWT `tid`.

**Deliverables**

- [x] `resolveTenant`, `bindTenantContext`, JWT `tid`, login scoped by tenant
- [x] `authStore` tenant fields
- [x] `activeTenantId()` / `activeTenantIdFromContext()` — no silent default on API handlers

---

## Phase 4 — PostgreSQL RLS

**Goal:** DB-enforced isolation.

**Deliverables:** All complete — migration `052`, `npm run test:security`.

---

## Phase 5 — Hardening & polish

**Goal:** Production-ready isolation, storage, and UX.

**Deliverables**

- [x] `051_db_roles.sql` — optional prod roles (change passwords after apply)
- [x] Tenant-scoped uploads: `uploads/{tenantId}/…`
- [x] Tenant-scoped report PDF cache: `cache/reports/{tenantId}/{reportId}.pdf` via [`reportPdfCache.ts`](../apps/api/src/utils/reportPdfCache.ts)
- [x] Settings/reports use `activeTenantIdFromContext()` (not `getDefaultTenantId` on requests)
- [x] HTTP cache keys include `tenant_id`
- [x] Platform UI: edit tenant, module toggles, copy sign-in URL, audit log panel
- [x] `tenant_settings.feature_flags` + `requireFeature()` on fees, exams, alevel, timetable, attendance, analytics
- [x] `platform_audit_log` + logging on tenant CRUD (`053`)

**Verify**

- Regenerate reports clears tenant PDF cache; second PDF request hits disk cache.
- Disable `fees` for a tenant on platform → school API returns `403 FEATURE_DISABLED`.

---

## Phase 6 — Isolation enforcement

**Goal:** New schools must not see other schools' data.

**Root cause:** `postgres` superuser bypasses RLS even when `tenant_id` and policies exist.

**Deliverables**

- [x] `school_app` role + `npm run setup:db-roles`
- [x] API startup warning when DB role bypasses RLS
- [x] JWT `tsl` (tenant slug); web redirects to correct subdomain
- [x] `requireAuth` re-binds `tenantContext` from JWT `tid`
- [x] Explicit `tenant_id` filters on dashboard, users list, student browse
- [x] [multitenant-isolation.md](multitenant-isolation.md)

**You must:** Point `DATABASE_URL` at `school_app` and restart the API.

---

## Phase 7 — Production ops (backlog)

- [ ] Wire `DATABASE_URL` / `PLATFORM_DATABASE_URL` to dedicated PG roles from `051`
- [ ] Wildcard DNS `*.yourdomain.com`
- [ ] Per-tenant backup/export script
- [ ] Rate limits keyed by `tenant_id`
- [ ] Custom domain column on `tenant_domains`
- [ ] Security review (cross-tenant IDOR, RLS bypass)

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | School API (RLS) |
| `PLATFORM_DATABASE_URL` | Platform provisioning (BYPASSRLS in prod) |
| `DATABASE_URL_MIGRATE` | Migrations |
| `APP_ROOT_DOMAIN` | Subdomain parsing |
| `DEFAULT_TENANT_SLUG` | Bare `localhost` fallback only |

---

## Local URLs

| URL | Role |
|-----|------|
| `http://default.localhost:3000` | Default school |
| `http://{slug}.localhost:3000` | School by slug |
| `http://platform.localhost:3000` | Platform admin |

---

## Implementation notes

1. Platform admins live in `platform_admins` only — never in school `users`.
2. New tenant tables: `tenant_id` + RLS policy + insert trigger (copy `052`).
3. New modules: add key to `TENANT_FEATURE_FLAG_KEYS` and `requireFeature()` on router.
4. Update this doc when adding migration `054+`.

---

## Performance (multitenant)

| Layer | Mechanism |
|-------|-----------|
| API DB | [`requestDbMiddleware`](apps/api/src/middleware/requestDb.ts) — one pooled client + `BEGIN` + `app.tenant_id` per HTTP request; all `query()` calls reuse it (no per-query transaction). |
| API | [`tenantCache`](apps/api/src/utils/tenantCache.ts) — in-memory slug → tenant lookup (5 min TTL); invalidated on platform tenant create/update. |
| API | Aggregate reads: `GET /api/analytics/dashboard` (KPIs + teacher count + 8 recent students), `GET /api/academic/summary` (structure counts). |
| API | In-process GET cache ([`cacheLayer`](apps/api/src/middleware/cacheLayer.ts)) per tenant + role; busted on academic/student/user/fee writes. |
| Web | React Query `staleTime` + [`queryKeys`](apps/web/src/lib/queryKeys.ts) scoped by tenant slug. |

**Production follow-up:** Redis for tenant + response cache when running multiple API instances; PgBouncer; read replica for heavy reports.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-29 | Initial doc; Phases 0–4 |
| 2026-05-29 | Phase 5: uploads, roles, authStore, request tenant helpers |
| 2026-05-29 | Phase 5 complete: PDF cache, feature flags, platform audit, platform edit UI |
| 2026-05-29 | Unified seed: platform super-admin + `npm run setup`; login banner after seed |
| 2026-05-29 | Performance: request-scoped DB, tenant cache, dashboard/academic aggregates |
