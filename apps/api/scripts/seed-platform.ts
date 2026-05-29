import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { platformPool } from "../src/config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function main(): Promise<void> {
  const email = (
    process.env.PLATFORM_ADMIN_EMAIL ?? "platform@school.local"
  )
    .toLowerCase()
    .trim();
  const password = process.env.PLATFORM_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error("Set PLATFORM_ADMIN_PASSWORD or ADMIN_PASSWORD in .env");
    process.exit(1);
  }
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);
  const hash = await bcrypt.hash(password, rounds);
  const fullName = process.env.PLATFORM_ADMIN_NAME?.trim() || "Platform Super Admin";

  await platformPool.query(
    `INSERT INTO platform_admins (full_name, email, password_hash, is_active)
     VALUES ($1, $2, $3, TRUE)
     ON CONFLICT (email)
     DO UPDATE SET
       full_name = EXCLUDED.full_name,
       password_hash = EXCLUDED.password_hash,
       is_active = TRUE,
       updated_at = NOW()`,
    [fullName, email, hash],
  );
  console.log(`Platform admin seeded: ${email}`);
  await platformPool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
