import dotenv from "dotenv";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const { Pool } = pg;
const migrateUrl =
  process.env.DATABASE_URL_MIGRATE?.trim() ||
  process.env.DATABASE_URL?.trim();

async function main(): Promise<void> {
  if (!migrateUrl) {
    console.error("DATABASE_URL or DATABASE_URL_MIGRATE is not set");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: migrateUrl });
  const dir = path.join(__dirname, "../src/database/migrations");
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = await pool.connect();
  try {
    const { rows: existsRows } = await client.query<{ e: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = '_migrations'
      ) AS e`,
    );
    if (!existsRows[0]?.e) {
      const sql0 = await readFile(path.join(dir, "000_create_migrations_table.sql"), "utf8");
      await client.query(sql0);
      console.log("Bootstrapped _migrations");
    }

    for (const file of files) {
      const applied = await client.query(`SELECT 1 FROM _migrations WHERE filename = $1`, [file]);
      if (applied.rowCount && applied.rowCount > 0) {
        console.log(`Skip ${file} (already applied)`);
        continue;
      }
      const sql = await readFile(path.join(dir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(`INSERT INTO _migrations (filename) VALUES ($1)`, [file]);
        await client.query("COMMIT");
        console.log(`Applied ${file}`);
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    }
    console.log("Migrations complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  const pgErr = e as { code?: string; message?: string };
  if (pgErr.code === "42501" && pgErr.message?.includes("owner")) {
    console.error(
      "\nMigration failed: migration_admin does not own the table.\n" +
        "Run once as PostgreSQL superuser:\n" +
        "  npm run transfer:db-ownership\n" +
        "Or: sudo -u postgres psql -d school_manage -f apps/api/scripts/sql/transfer-public-ownership.sql\n",
    );
  }
  console.error(e);
  process.exit(1);
});
