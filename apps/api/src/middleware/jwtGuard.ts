import type { NextFunction, Request, Response } from "express";
import { createHash } from "crypto";
import { query, tenantContext } from "../config/db.js";
import type { Role } from "@uganda-cbc-sms/shared";
import { verifyToken, type JwtPayload } from "../utils/jwt.js";
import { isTokenBlacklisted } from "../utils/tokenBlacklist.js";
import {
  sessionInactivityMinutes,
  validateAndTouchSession,
} from "../modules/auth/session.service.js";

const ROLE_RECHECK_SECONDS = 30 * 60;

async function resolveRole(payload: JwtPayload): Promise<Role> {
  const age = Math.floor(Date.now() / 1000) - payload.iat;
  if (age < ROLE_RECHECK_SECONDS) return payload.role;

  const { rows } = await query<{ role: Role }>(
    `SELECT role FROM users WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
    [payload.sub, payload.tid],
  );
  if (!rows[0]) throw new Error("User not found");
  return rows[0].role;
}

function setSessionIdleHeaders(res: Response, idleExpiresAt: Date): void {
  const unix = Math.floor(idleExpiresAt.getTime() / 1000);
  res.setHeader("X-Session-Idle-Expires-At", String(unix));
  res.setHeader("X-Session-Inactivity-Minutes", String(sessionInactivityMinutes()));
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Please sign in to continue. Your session token is missing or invalid.",
      code: "UNAUTHORIZED",
    });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    if (await isTokenBlacklisted(payload.jti)) {
      res.status(401).json({
        success: false,
        error: "Your session has ended. Please sign in again.",
        code: "UNAUTHORIZED",
      });
      return;
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const session = await validateAndTouchSession(payload.sid, payload.sub, tokenHash);
    if (!session) {
      res.status(401).json({
        success: false,
        error: "Your session ended due to inactivity. Please sign in again.",
        code: "SESSION_EXPIRED",
      });
      return;
    }

    setSessionIdleHeaders(res, session.idleExpiresAt);

    if (req.tenant && payload.tid !== req.tenant.id) {
      res.status(401).json({
        success: false,
        error: "Your session is not valid for this school. Please sign in again.",
        code: "TENANT_MISMATCH",
      });
      return;
    }

    const role = await tenantContext.run(payload.tid, async () => resolveRole(payload));
    req.user = {
      id: payload.sub,
      role,
      sessionId: payload.sid,
      tenantId: payload.tid,
      tenantSlug: payload.tsl,
    };
    if (req.tenant) {
      req.tenant = {
        ...req.tenant,
        id: payload.tid,
        slug: payload.tsl,
      };
    }
    tenantContext.run(payload.tid, () => next());
  } catch {
    res.status(401).json({
      success: false,
      error: "Your login session is no longer valid. Please sign in again.",
      code: "UNAUTHORIZED",
    });
  }
}
