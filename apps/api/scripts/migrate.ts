import "dotenv/config";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../src/config/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
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
  console.error(e);
  process.exit(1);
});
