/**
 * Transfers public schema objects to migration_admin so DDL migrations can run.
 * Requires PostgreSQL superuser (DATABASE_URL_SUPERUSER or postgres bootstrap URL).
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString =
  process.env.DATABASE_URL_SUPERUSER?.trim() ??
  process.env.DATABASE_URL_MIGRATE?.trim() ??
  process.env.DATABASE_URL?.trim();

async function main(): Promise<void> {
  if (!connectionString) {
    console.error("Set DATABASE_URL_SUPERUSER to your postgres superuser URL.");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString });
  const sqlPath = path.resolve(__dirname, "sql/transfer-public-ownership.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  try {
    const { rows } = await pool.query<{ super: boolean }>(
      `SELECT rolsuper AS super FROM pg_roles WHERE rolname = current_user`,
    );
    if (!rows[0]?.super) {
      console.error(
        "Current role is not a superuser. Set DATABASE_URL_SUPERUSER to postgres and retry.",
      );
      process.exit(1);
    }

    await pool.query(sql);
    console.log("Public schema ownership transferred to migration_admin.");
    console.log("Run: npm run migrate");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
