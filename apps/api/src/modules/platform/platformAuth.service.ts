import type { PlatformLoginInput } from "@uganda-cbc-sms/shared";
import bcrypt from "bcrypt";
import { platformQuery } from "../../config/db.js";
import { HttpError } from "../../utils/httpError.js";
import { signPlatformToken } from "../../utils/jwt.js";

export async function platformLogin(
  input: PlatformLoginInput,
): Promise<{ token: string; admin: { id: string; email: string; fullName: string } }> {
  const email = input.email.toLowerCase().trim();
  const { rows } = await platformQuery<{
    id: string;
    email: string;
    full_name: string;
    password_hash: string;
    is_active: boolean;
  }>(
    `SELECT id, email, full_name, password_hash, is_active
     FROM platform_admins WHERE email = $1`,
    [email],
  );
  if (!rows[0] || !rows[0].is_active) {
    throw new HttpError(401, "Invalid platform credentials.");
  }
  const ok = await bcrypt.compare(input.password, rows[0].password_hash);
  if (!ok) {
    throw new HttpError(401, "Invalid platform credentials.");
  }
  const token = signPlatformToken(rows[0].id);
  return {
    token,
    admin: {
      id: rows[0].id,
      email: rows[0].email,
      fullName: rows[0].full_name,
    },
  };
}
