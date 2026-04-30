import "dotenv/config";
import bcrypt from "bcrypt";
import { pool } from "../src/config/db";

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
    process.exit(1);
  }
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);
  const { rows } = await pool.query(`SELECT id FROM users LIMIT 1`);
  if (rows.length > 0) {
    console.log("Users already exist — skipping seed.");
    await pool.end();
    return;
  }
  const hash = await bcrypt.hash(password, rounds);
  await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')`,
    ["System Administrator", email, hash],
  );
  console.log(`Created admin user: ${email}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
