/**
 * Creates local Postgres test DB for Jest security tests (tenantIsolation, etc.).
 *
 * Expects: postgresql://test:test@localhost:5432/school_manage_test (see tests/setup.ts)
 *
 * Requires PostgreSQL superuser once to create the database (sudo -u postgres).
 * Migrations run as migration_admin (same as local dev).
 */
import { spawnSync } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const host = process.env.TEST_DB_HOST ?? "127.0.0.1";
const port = process.env.TEST_DB_PORT ?? "5432";
const dbName = "school_manage_test";
const migratePassword = process.env.MIGRATION_ADMIN_PASSWORD ?? "change_me_migration";
const migrateUrl =
  process.env.DATABASE_URL_MIGRATE_TEST?.trim() ??
  `postgresql://migration_admin:${encodeURIComponent(migratePassword)}@${host}:${port}/${dbName}`;
const testUrl =
  process.env.DATABASE_URL_TEST?.trim() ??
  `postgresql://test:test@${host}:${port}/${dbName}`;

const bootstrapSql = path.join(__dirname, "sql/setup-test-database.sql");
const grantSql = path.join(__dirname, "sql/grant-test-database.sql");

async function runSuperuserBootstrap(): Promise<void> {
  const superUrl = process.env.LOCAL_DATABASE_SUPERUSER?.trim();
  if (superUrl) {
    const sql = fs.readFileSync(bootstrapSql, "utf8");
    const pool = new pg.Pool({ connectionString: superUrl });
    try {
      await pool.query(sql);
      console.log("Bootstrap SQL applied via LOCAL_DATABASE_SUPERUSER.");
      return;
    } finally {
      await pool.end();
    }
  }

  console.log("Applying bootstrap SQL as OS user postgres (sudo)...");
  const result = spawnSync(
    "sudo",
    ["-u", "postgres", "psql", "-v", "ON_ERROR_STOP=1", "-f", bootstrapSql],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    console.error(
      "\nBootstrap failed. Either:\n" +
        "  1. Run manually: sudo -u postgres psql -v ON_ERROR_STOP=1 -f apps/api/scripts/sql/setup-test-database.sql\n" +
        "  2. Set LOCAL_DATABASE_SUPERUSER=postgresql://postgres:...@127.0.0.1:5432/postgres\n",
    );
    process.exit(result.status ?? 1);
  }
}

async function runMigrations(): Promise<void> {
  console.log(`Running migrations on ${dbName}...`);
  const result = spawnSync("tsx", ["scripts/migrate-test-database.ts"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL_MIGRATE: migrateUrl, DATABASE_URL: migrateUrl },
    cwd: path.join(__dirname, ".."),
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function grantTestRole(): Promise<void> {
  const sql = fs.readFileSync(grantSql, "utf8");
  const pool = new pg.Pool({ connectionString: migrateUrl });
  try {
    await pool.query(sql);
    console.log("Granted test role access on public schema.");
  } finally {
    await pool.end();
  }
}

async function verifyTestConnection(): Promise<void> {
  const pool = new pg.Pool({ connectionString: testUrl });
  try {
    const { rows } = await pool.query<{ bypass: boolean }>(
      `SELECT rolbypassrls AS bypass FROM pg_roles WHERE rolname = 'test'`,
    );
    if (rows[0]?.bypass) {
      throw new Error("test role must not have BYPASSRLS (RLS tests would be meaningless)");
    }
    await pool.query("SELECT 1");
    console.log(`Verified connection: ${testUrl.replace(/:[^:@]+@/, ":***@")}`);
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  await runSuperuserBootstrap();
  await runMigrations();
  await grantTestRole();
  await verifyTestConnection();
  console.log("\nTest database ready. Run: npm run test:security --workspace=apps/api");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
