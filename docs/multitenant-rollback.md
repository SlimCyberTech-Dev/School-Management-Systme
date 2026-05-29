# Multi-tenant rollback guide

Use this guide to snapshot the single-tenant system before multi-tenant migrations and to roll back if needed.

## Pre-flight checklist (before Phase 1 migrations)

1. Commit or stash all local changes.
2. Create git tag on current HEAD:
   ```bash
   git tag -a v1-single-tenant -m "Single-tenant baseline before multi-tenant"
   ```
3. Back up the database:
   ```bash
   npm run backup:db
   ```
4. Verify `backups/school_manage_*.sql` exists and is non-empty.
5. Optionally copy file storage:
   - `apps/api/uploads/` (if present)
   - `cache/reports/` (if present)
6. Copy `.env` locally (never commit secrets).

## Rollback procedure

### Code only

```bash
git checkout v1-single-tenant
npm install
```

### Database

```bash
npm run restore:db -- backups/school_manage_YYYYMMDD_HHMMSS.sql --yes
```

### Uploaded files

Restore copies of `uploads/` and `cache/reports/` if you backed them up.

## After rollback

- Re-run `npm run migrate` only if you are on single-tenant code and need schema sync.
- Do not run multi-tenant migrations (046+) on a restored single-tenant dump without matching application code.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run backup:db` | `pg_dump` of `DATABASE_URL` → `backups/` |
| `npm run restore:db -- <file.sql>` | Restore dump via `psql` (prompts for confirmation) |
| `npm run restore:db -- <file.sql> --yes` | Restore without prompt |

Requires PostgreSQL client tools (`pg_dump`, `psql`) on PATH.
