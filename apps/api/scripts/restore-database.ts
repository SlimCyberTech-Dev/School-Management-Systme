import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirnameRestore = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirnameRestore, "../.env") });
dotenv.config({ path: path.resolve(__dirnameRestore, "../../../.env") });

import { spawnSync } from "child_process";
import { existsSync } from "fs";
import readline from "readline";

function usage(): void {
  console.log(`Usage: tsx scripts/restore-database.ts <path-to-backup.sql> [--yes]

Restores a pg_dump SQL file into the database from DATABASE_URL.
WARNING: This runs SQL against your database and may overwrite data.`);
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "yes");
    });
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const autoYes = args.includes("--yes");
  const fileArg = args.find((a) => !a.startsWith("--"));

  if (!fileArg) {
    usage();
    process.exit(1);
  }

  const dumpPath = path.resolve(fileArg);
  if (!existsSync(dumpPath)) {
    console.error(`Backup file not found: ${dumpPath}`);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  if (!autoYes) {
    const ok = await confirm(
      `Restore ${dumpPath} into DATABASE_URL? This may destroy existing data.`,
    );
    if (!ok) {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  console.log(`Restoring ${dumpPath} ...`);
  const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", dumpPath], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    console.error("psql restore failed.");
    process.exit(result.status ?? 1);
  }

  console.log("Restore complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
