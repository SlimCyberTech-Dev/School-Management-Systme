import type { NextFunction, Request, Response } from "express";
import { platformQuery } from "../config/db.js";
import { verifyPlatformToken } from "../utils/jwt.js";

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
  try {
    const payload = verifyPlatformToken(header.slice(7));
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
