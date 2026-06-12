import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../utils/httpError";

export function requireExamRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Please sign in to continue." });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: "You do not have permission to perform this action." });
      return;
    }
    next();
  };
}
