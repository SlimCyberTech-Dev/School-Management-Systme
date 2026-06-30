/**
 * Run migrations against DATABASE_URL_MIGRATE without loading .env overrides.
 * Used by setup:test-db when .env points at a remote database.
 */
import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrateUrl =
  process.env.DATABASE_URL_MIGRATE?.trim() || process.env.DATABASE_URL?.trim();
if (!migrateUrl) {
  console.error("Set DATABASE_URL_MIGRATE");
  process.exit(1);
}

async function main(): Promise<void> {
  const pool = new pg.Pool({ connectionString: migrateUrl });
  const dir = path.join(__dirname, "../src/database/migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const client = await pool.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS _migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )`,
    );
    for (const file of files) {
      const applied = await client.query(`SELECT 1 FROM _migrations WHERE filename = $1`, [file]);
      if (applied.rowCount && applied.rowCount > 0) {
        console.log(`Skip ${file}`);
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
  console.error(e);
  process.exit(1);
});
