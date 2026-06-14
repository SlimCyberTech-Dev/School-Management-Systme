import type { CreatePlatformAdminInput } from "@uganda-cbc-sms/shared";
import bcrypt from "bcrypt";
import { platformQuery } from "../../config/db.js";
import { loadEnv } from "../../config/env.js";
import { HttpError } from "../../utils/httpError.js";
import { generateTemporaryPassword } from "../../utils/generatePassword.js";
import { logPlatformAction } from "./platformAudit.service.js";
import { revokeAllPlatformSessions } from "./platformSession.service.js";

export type PlatformAdminListItem = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export async function listPlatformAdmins(): Promise<PlatformAdminListItem[]> {
  const { rows } = await platformQuery<{
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    last_login_at: Date | null;
    created_at: Date;
  }>(
    `SELECT id, email, full_name, is_active, last_login_at, created_at
     FROM platform_admins
     ORDER BY created_at ASC`,
  );
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    isActive: r.is_active,
    lastLoginAt: r.last_login_at?.toISOString() ?? null,
    createdAt: r.created_at.toISOString(),
  }));
}

export async function createPlatformAdmin(
  input: CreatePlatformAdminInput,
  actorId: string,
): Promise<{ admin: PlatformAdminListItem; temporaryPassword: string }> {
  const env = loadEnv();
  const email = input.email.toLowerCase().trim();
  const fullName = input.fullName.trim();
  const temporaryPassword = input.password?.trim() || generateTemporaryPassword();
  const hash = await bcrypt.hash(temporaryPassword, env.BCRYPT_ROUNDS);

  const existing = await platformQuery(`SELECT 1 FROM platform_admins WHERE email = $1`, [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    throw new HttpError(409, "A platform operator with this email already exists.");
  }

  const { rows } = await platformQuery<{
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    last_login_at: Date | null;
    created_at: Date;
  }>(
    `INSERT INTO platform_admins (full_name, email, password_hash, is_active)
     VALUES ($1, $2, $3, TRUE)
     RETURNING id, email, full_name, is_active, last_login_at, created_at`,
    [fullName, email, hash],
  );
  const r = rows[0]!;

  await logPlatformAction({
    actorId,
    action: "PLATFORM_ADMIN_CREATED",
    metadata: { email, fullName },
  });

  return {
    admin: {
      id: r.id,
      email: r.email,
      fullName: r.full_name,
      isActive: r.is_active,
      lastLoginAt: r.last_login_at?.toISOString() ?? null,
      createdAt: r.created_at.toISOString(),
    },
    temporaryPassword: input.password ? "" : temporaryPassword,
  };
}

export async function deactivatePlatformAdmin(
  targetId: string,
  actorId: string,
): Promise<PlatformAdminListItem> {
  if (targetId === actorId) {
    throw new HttpError(400, "You cannot deactivate your own account.");
  }

  const activeCount = await platformQuery<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM platform_admins WHERE is_active = TRUE`,
  );
  if ((activeCount.rows[0]?.c ?? 0) <= 1) {
    throw new HttpError(409, "Cannot deactivate the last active platform operator.");
  }

  const { rows } = await platformQuery<{
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    last_login_at: Date | null;
    created_at: Date;
  }>(
    `UPDATE platform_admins
     SET is_active = FALSE, updated_at = NOW()
     WHERE id = $1 AND is_active = TRUE
     RETURNING id, email, full_name, is_active, last_login_at, created_at`,
    [targetId],
  );
  if (!rows[0]) throw new HttpError(404, "Platform operator not found or already inactive.");

  await revokeAllPlatformSessions(targetId);

  await logPlatformAction({
    actorId,
    action: "PLATFORM_ADMIN_DEACTIVATED",
    metadata: { targetId, email: rows[0].email },
  });

  const r = rows[0];
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    isActive: r.is_active,
    lastLoginAt: r.last_login_at?.toISOString() ?? null,
    createdAt: r.created_at.toISOString(),
  };
}
