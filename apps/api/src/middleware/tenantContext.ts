import type { NextFunction, Request, Response } from "express";
import { tenantContext } from "../config/db.js";

export function bindTenantContext(req: Request, res: Response, next: NextFunction): void {
  if (!req.tenant?.id) {
    next();
    return;
  }
  tenantContext.run(req.tenant.id, () => next());
}
