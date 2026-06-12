import type { Request } from "express";
import { HttpError } from "./httpError.js";

/** Tenant id for authenticated school routes (no silent default-tenant fallback). */
export function requireRequestTenantId(req: Request): string {
  const id = req.tenant?.id ?? req.user?.tenantId;
  if (!id) {
    throw new HttpError(400, "School context is required for this request.");
  }
  return id;
}
