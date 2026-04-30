import type { Role } from "@uganda-cbc-sms/shared";
import type { NextFunction, Request, Response } from "express";

export function requireRoles(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }
    if (!allowed.includes(req.user.role)) {
      res.status(403).json({ success: false, error: "Forbidden" });
      return;
    }
    next();
  };
}
