import type { NextFunction, Request, Response } from "express";
import { createHash } from "crypto";
import { platformQuery } from "../config/db.js";
import { verifyPlatformToken } from "../utils/jwt.js";
import { isTokenBlacklisted } from "../utils/tokenBlacklist.js";
import {
  platformSessionInactivityMinutes,
  validateAndTouchPlatformSession,
} from "../modules/platform/platformSession.service.js";

function setSessionIdleHeaders(res: Response, idleExpiresAt: Date): void {
  const unix = Math.floor(idleExpiresAt.getTime() / 1000);
  res.setHeader("X-Session-Idle-Expires-At", String(unix));
  res.setHeader("X-Session-Inactivity-Minutes", String(platformSessionInactivityMinutes()));
}

export async function requirePlatformAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Platform sign-in required.",
      code: "UNAUTHORIZED",
    });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = verifyPlatformToken(token);
    if (await isTokenBlacklisted(payload.jti)) {
      res.status(401).json({
        success: false,
        error: "Your platform session has ended. Please sign in again.",
        code: "UNAUTHORIZED",
      });
      return;
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const session = await validateAndTouchPlatformSession(payload.sid, payload.sub, tokenHash);
    if (!session) {
      res.status(401).json({
        success: false,
        error: "Your session ended due to inactivity. Please sign in again.",
        code: "SESSION_EXPIRED",
      });
      return;
    }

    setSessionIdleHeaders(res, session.idleExpiresAt);

    const { rows } = await platformQuery<{ id: string; email: string; full_name: string }>(
      `SELECT id, email, full_name FROM platform_admins
       WHERE id = $1 AND is_active = TRUE`,
      [payload.sub],
    );
    if (!rows[0]) {
      res.status(401).json({
        success: false,
        error: "Platform account not found or inactive.",
        code: "UNAUTHORIZED",
      });
      return;
    }
    req.platformAdmin = {
      id: rows[0].id,
      email: rows[0].email,
      fullName: rows[0].full_name,
      sessionId: payload.sid,
    };
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: "Invalid platform session.",
      code: "UNAUTHORIZED",
    });
  }
}
