import fs from "fs";
import path from "path";
import type { Request } from "express";
import { loadEnv } from "../config/env.js";

export function uploadRootDir(): string {
  return loadEnv().UPLOAD_DIR;
}

export function reportCacheRootDir(): string {
  return loadEnv().REPORT_CACHE_DIR;
}

/** Resolve tenant id from request (set by resolveTenant middleware). */
export function tenantIdFromRequest(req: Request): string {
  const id = req.tenant?.id;
  if (!id) {
    throw new Error("Tenant context is required for this operation");
  }
  return id;
}

/** `uploads/{tenantId}/{segment}` — created if missing. */
export function tenantUploadDir(req: Request, segment: string): string {
  const dir = path.join(uploadRootDir(), tenantIdFromRequest(req), segment);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Public URL path served by express.static under /uploads. */
export function tenantUploadUrlPath(req: Request, segment: string, filename: string): string {
  return `/uploads/${tenantIdFromRequest(req)}/${segment}/${filename}`;
}

/** `cache/reports/{tenantId}` */
export function tenantReportCacheDir(tenantId: string): string {
  const dir = path.join(reportCacheRootDir(), tenantId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
