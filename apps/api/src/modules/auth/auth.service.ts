import type { LoginInput, ChangePasswordInput } from "@uganda-cbc-sms/shared";
import bcrypt from "bcrypt";
import { query } from "../../config/db";
import { HttpError } from "../../utils/httpError";
import { signToken } from "../../utils/jwt";
import { toUserPublic } from "../../utils/userMapper";

export async function login(
  input: LoginInput,
): Promise<{ token: string; user: ReturnType<typeof toUserPublic> }> {
  try {
    const { rows } = await query<{
      id: string;
      full_name: string;
      email: string;
      role: string;
      is_active: boolean;
      created_at: Date;
      password_hash: string;
      failed_login_attempts: number;
      locked_at: Date | null;
    }>(
      `SELECT * FROM users WHERE email = $1`,
      [input.email.toLowerCase().trim()],
    );
    const generic = () => new HttpError(401, "Invalid credentials");

    if (rows.length === 0) throw generic();
    const user = rows[0]!;

    if (!user.is_active) {
      throw new HttpError(403, "Account deactivated — contact administrator.");
    }
    if (user.locked_at) {
      throw new HttpError(403, "Account locked — contact administrator.");
    }

    const ok = await bcrypt.compare(input.password, user.password_hash);
    if (!ok) {
      const attempts = (user.failed_login_attempts ?? 0) + 1;
      const lock = attempts >= 5;
      await query(
        `UPDATE users SET failed_login_attempts = $1, locked_at = CASE WHEN $2 THEN NOW() ELSE locked_at END, updated_at = NOW()
         WHERE id = $3`,
        [attempts, lock, user.id],
      );
      throw generic();
    }

    await query(
      `UPDATE users SET failed_login_attempts = 0, locked_at = NULL, updated_at = NOW() WHERE id = $1`,
      [user.id],
    );

    const token = signToken(user.id, user.role as Parameters<typeof signToken>[1]);
    return {
      token,
      user: toUserPublic({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
      }),
    };
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new Error(e instanceof Error ? e.message : "Login failed");
  }
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  try {
    const { rows } = await query<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE id = $1`,
      [userId],
    );
    if (rows.length === 0) throw new HttpError(404, "User not found");
    const ok = await bcrypt.compare(input.currentPassword, rows[0]!.password_hash);
    if (!ok) throw new HttpError(400, "Current password is incorrect");
    const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);
    const hash = await bcrypt.hash(input.newPassword, rounds);
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [
      hash,
      userId,
    ]);
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new Error(e instanceof Error ? e.message : "Could not change password");
  }
}
