import type { ChangePasswordInput, PlatformLoginInput } from "@uganda-cbc-sms/shared";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { platformQuery } from "../../config/db.js";
import { loadEnv } from "../../config/env.js";
import {
  clearLoginAttemptsForEmail,
  logLoginAttempt,
  maxLoginAttempts,
} from "../../middleware/accountLockout.js";
import { HttpError } from "../../utils/httpError.js";
import {
  signPlatformToken,
  tokenRemainingSeconds,
  verifyPlatformToken,
} from "../../utils/jwt.js";
import { blacklistToken } from "../../utils/tokenBlacklist.js";
import { logPlatformAction } from "./platformAudit.service.js";
import {
  platformIdleExpiresAtFrom,
  platformSessionInactivityMinutes,
  revokeAllPlatformSessions,
  revokePlatformSession,
} from "./platformSession.service.js";

type LoginMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceInfo?: string | null;
};

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function lockoutIdentifier(email: string): string {
  return `platform:${normalizeEmail(email)}`;
}

function hashSecret(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function computeExpiryDate(token: string): Date {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  if (!decoded?.exp) {
    return new Date(Date.now() + 8 * 60 * 60 * 1000);
  }
  return new Date(decoded.exp * 1000);
}

export async function platformLogin(
  input: PlatformLoginInput,
  meta: LoginMeta = {},
): Promise<{
  token: string;
  admin: { id: string; email: string; fullName: string };
  session: { inactivityMinutes: number; idleExpiresAt: string };
}> {
  const email = normalizeEmail(input.email);
  const identifier = lockoutIdentifier(email);
  const generic = () => new HttpError(401, "Invalid platform credentials.");

  const { rows } = await platformQuery<{
    id: string;
    email: string;
    full_name: string;
    password_hash: string;
    is_active: boolean;
    failed_login_attempts: number;
    locked_until: Date | null;
  }>(
    `SELECT id, email, full_name, password_hash, is_active,
            failed_login_attempts, locked_until
     FROM platform_admins WHERE email = $1`,
    [email],
  );

  if (!rows[0] || !rows[0].is_active) {
    logLoginAttempt(identifier, meta.ipAddress, false);
    throw generic();
  }

  const admin = rows[0];

  if (admin.locked_until && admin.locked_until.getTime() > Date.now()) {
    logLoginAttempt(identifier, meta.ipAddress, false);
    throw new HttpError(
      423,
      "Account locked after too many failed attempts. Try again in 30 minutes.",
    );
  }

  if (admin.locked_until && admin.locked_until.getTime() <= Date.now()) {
    await platformQuery(
      `UPDATE platform_admins
       SET locked_at = NULL, locked_until = NULL, failed_login_attempts = 0, updated_at = NOW()
       WHERE id = $1`,
      [admin.id],
    );
  }

  const ok = await bcrypt.compare(input.password, admin.password_hash);
  if (!ok) {
    logLoginAttempt(identifier, meta.ipAddress, false);
    const attempts = admin.failed_login_attempts + 1;
    const lock = attempts >= maxLoginAttempts();
    await platformQuery(
      `UPDATE platform_admins
       SET failed_login_attempts = $1,
           locked_at = CASE WHEN $2::boolean THEN NOW() ELSE locked_at END,
           locked_until = CASE WHEN $2::boolean THEN NOW() + interval '30 minutes' ELSE locked_until END,
           updated_at = NOW()
       WHERE id = $3`,
      [attempts, lock, admin.id],
    );
    await logPlatformAction({
      actorId: admin.id,
      action: "PLATFORM_LOGIN_FAILED",
      metadata: { failedAttempts: attempts, locked: lock, ipAddress: meta.ipAddress },
    });
    if (lock) {
      throw new HttpError(
        423,
        "Account locked after too many failed attempts. Try again in 30 minutes.",
      );
    }
    throw generic();
  }

  logLoginAttempt(identifier, meta.ipAddress, true);
  await clearLoginAttemptsForEmail(identifier);

  await platformQuery(
    `UPDATE platform_admins
     SET failed_login_attempts = 0,
         locked_at = NULL,
         locked_until = NULL,
         last_login_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [admin.id],
  );

  const sessionId = crypto.randomUUID();
  const token = signPlatformToken(admin.id, sessionId);
  const tokenHash = hashSecret(token);
  const expiresAt = computeExpiryDate(token);
  const now = new Date();

  await platformQuery(
    `INSERT INTO platform_auth_sessions (
       id, admin_id, token_hash, device_info, ip_address, user_agent,
       expires_at, last_activity_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      sessionId,
      admin.id,
      tokenHash,
      meta.deviceInfo ?? null,
      meta.ipAddress ?? null,
      meta.userAgent ?? null,
      expiresAt,
      now,
    ],
  );

  await logPlatformAction({
    actorId: admin.id,
    action: "PLATFORM_LOGIN_SUCCESS",
    metadata: { ipAddress: meta.ipAddress, userAgent: meta.userAgent },
  });

  const inactivityMinutes = platformSessionInactivityMinutes();
  const idleExpiresAt = platformIdleExpiresAtFrom(now, inactivityMinutes);

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      fullName: admin.full_name,
    },
    session: {
      inactivityMinutes,
      idleExpiresAt: idleExpiresAt.toISOString(),
    },
  };
}

export async function platformLogout(sessionId: string, bearerToken?: string): Promise<void> {
  const { rows } = await platformQuery<{ admin_id: string }>(
    `UPDATE platform_auth_sessions
     SET revoked_at = NOW()
     WHERE id = $1 AND revoked_at IS NULL
     RETURNING admin_id`,
    [sessionId],
  );
  const adminId = rows[0]?.admin_id;
  if (bearerToken) {
    try {
      const payload = verifyPlatformToken(bearerToken);
      await blacklistToken(payload.jti, tokenRemainingSeconds(payload.exp));
    } catch {
      /* token already invalid */
    }
  }
  if (adminId) {
    await logPlatformAction({
      actorId: adminId,
      action: "PLATFORM_LOGOUT",
    });
  }
}

export async function platformChangePassword(
  adminId: string,
  input: ChangePasswordInput,
  sessionId: string,
): Promise<{ token: string; session: { inactivityMinutes: number; idleExpiresAt: string } }> {
  const env = loadEnv();
  const { rows } = await platformQuery<{ password_hash: string }>(
    `SELECT password_hash FROM platform_admins WHERE id = $1 AND is_active = TRUE`,
    [adminId],
  );
  if (!rows[0]) throw new HttpError(404, "Platform account not found.");

  const ok = await bcrypt.compare(input.currentPassword, rows[0].password_hash);
  if (!ok) throw new HttpError(400, "Current password is incorrect.");

  const hash = await bcrypt.hash(input.newPassword, env.BCRYPT_ROUNDS);
  await platformQuery(
    `UPDATE platform_admins SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
    [adminId, hash],
  );

  await revokeAllPlatformSessions(adminId);

  const sessionIdNew = crypto.randomUUID();
  const token = signPlatformToken(adminId, sessionIdNew);
  const tokenHash = hashSecret(token);
  const expiresAt = computeExpiryDate(token);
  const now = new Date();

  await platformQuery(
    `INSERT INTO platform_auth_sessions (
       id, admin_id, token_hash, expires_at, last_activity_at
     )
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionIdNew, adminId, tokenHash, expiresAt, now],
  );

  await revokePlatformSession(sessionId);

  await logPlatformAction({
    actorId: adminId,
    action: "PLATFORM_PASSWORD_CHANGED",
  });

  const inactivityMinutes = platformSessionInactivityMinutes();
  return {
    token,
    session: {
      inactivityMinutes,
      idleExpiresAt: platformIdleExpiresAtFrom(now, inactivityMinutes).toISOString(),
    },
  };
}

export async function getPlatformAdminProfile(adminId: string): Promise<{
  id: string;
  email: string;
  fullName: string;
  lastLoginAt: string | null;
  createdAt: string;
}> {
  const { rows } = await platformQuery<{
    id: string;
    email: string;
    full_name: string;
    last_login_at: Date | null;
    created_at: Date;
  }>(
    `SELECT id, email, full_name, last_login_at, created_at
     FROM platform_admins WHERE id = $1 AND is_active = TRUE`,
    [adminId],
  );
  if (!rows[0]) throw new HttpError(404, "Platform account not found.");
  const r = rows[0];
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    lastLoginAt: r.last_login_at?.toISOString() ?? null,
    createdAt: r.created_at.toISOString(),
  };
}
