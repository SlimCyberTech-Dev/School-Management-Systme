/**
 * Applies migration 051 roles and sets passwords from .env.
 * Run as PostgreSQL superuser (your normal DATABASE_URL before switching to school_app).
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL_MIGRATE ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set DATABASE_URL (superuser) to run setup:db-roles");
  process.exit(1);
}

const schoolPassword = process.env.SCHOOL_APP_PASSWORD ?? "change_me_school_app";
const platformPassword = process.env.PLATFORM_APP_PASSWORD ?? "change_me_platform_app";
const migratePassword = process.env.MIGRATION_ADMIN_PASSWORD ?? "change_me_migration";

/** ALTER ROLE does not accept prepared-statement placeholders ($1). */
function pgPasswordLiteral(password: string): string {
  return `'${password.replace(/'/g, "''")}'`;
}

async function main(): Promise<void> {
  const sqlPath = path.resolve(__dirname, "../src/database/migrations/051_db_roles.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const pool = new pg.Pool({ connectionString });

  try {
    await pool.query(sql);
    await pool.query(`ALTER ROLE school_app WITH PASSWORD ${pgPasswordLiteral(schoolPassword)}`);
    await pool.query(`ALTER ROLE platform_app WITH PASSWORD ${pgPasswordLiteral(platformPassword)}`);
    await pool.query(
      `ALTER ROLE migration_admin WITH PASSWORD ${pgPasswordLiteral(migratePassword)}`,
    );

    const url = new URL(connectionString);
    const db = url.pathname.replace(/^\//, "") || "school_manage";
    const host = url.hostname || "localhost";
    const port = url.port || "5432";

    console.log("");
    console.log("Database roles ready. Update .env:");
    console.log("");
    console.log(
      `DATABASE_URL=postgresql://school_app:${encodeURIComponent(schoolPassword)}@${host}:${port}/${db}`,
    );
    console.log(
      `PLATFORM_DATABASE_URL=postgresql://platform_app:${encodeURIComponent(platformPassword)}@${host}:${port}/${db}`,
    );
    console.log(
      `DATABASE_URL_MIGRATE=postgresql://migration_admin:${encodeURIComponent(migratePassword)}@${host}:${port}/${db}`,
    );
    console.log("");
    console.log("Restart the API after updating .env.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
