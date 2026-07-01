import "../src/env-bootstrap.js";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { Pool } = pg;
const migrateUrl =
  process.env.DATABASE_URL_MIGRATE?.trim() ||
  process.env.DATABASE_URL?.trim();

async function main(): Promise<void> {
  if (!migrateUrl) {
    console.error("DATABASE_URL or DATABASE_URL_MIGRATE is not set");
    process.exit(1);
  }
  const migrateUser = new URL(migrateUrl.replace(/^postgresql:\/\//, "postgres://")).username;
  console.log(`Using migrate role: ${migrateUser}`);
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
      "\nMigration failed: the migrate role does not own the table.\n" +
        "Local Postgres: run once as superuser:\n" +
        "  npm run transfer:db-ownership\n" +
        "Render / managed Postgres (no superuser): set DATABASE_URL_MIGRATE to DATABASE_URL_SUPERUSER\n" +
        "  (the Render owner role, e.g. slim_school_user) in .env, then npm run migrate again.\n",
    );
  }
  console.error(e);
  process.exit(1);
});
