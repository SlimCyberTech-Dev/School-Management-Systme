/**
 * Load .env before any module reads process.env or calls loadEnv().
 * Import this file first in entrypoints (index.ts, scripts).
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));

const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(here, "../../.env"),
  path.resolve(here, "../../../.env"),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath, override: true });
}
