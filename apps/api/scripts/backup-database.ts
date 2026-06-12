import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { spawnSync } from "child_process";
import { mkdirSync, existsSync } from "fs";
const backupsDir = path.resolve(__dirname, "../../../backups");

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function main(): void {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  if (!existsSync(backupsDir)) {
    mkdirSync(backupsDir, { recursive: true });
  }

  const outfile = path.join(backupsDir, `school_manage_${timestamp()}.sql`);
  console.log(`Backing up to ${outfile} ...`);

  const result = spawnSync("pg_dump", ["--no-owner", "--no-acl", "-f", outfile, databaseUrl], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    console.error("pg_dump failed. Ensure PostgreSQL client tools are installed and on PATH.");
    process.exit(result.status ?? 1);
  }

  console.log(`Backup complete: ${outfile}`);
}

main();
