import type { Request, Response } from "express";
import {
  auditLogsArchiveSchema,
  auditLogsDeleteSchema,
  auditLogsQuerySchema,
} from "@uganda-cbc-sms/shared";
import * as svc from "./audit.service";

export async function list(req: Request, res: Response): Promise<void> {
  const filters = auditLogsQuerySchema.parse(req.query);
  const data = await svc.listAuditLogs(filters);
  res.json({ success: true, data });
}

export async function stats(_req: Request, res: Response): Promise<void> {
  const data = await svc.getAuditStats();
  res.json({ success: true, data });
}

export async function archive(req: Request, res: Response): Promise<void> {
  const body = auditLogsArchiveSchema.parse(req.body);
  const data = await svc.archiveAuditLogs(body, req.user!.id);
  res.json({ success: true, data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const body = auditLogsDeleteSchema.parse(req.body);
  const data = await svc.deleteAuditLogsPermanently(body);
  res.json({ success: true, data });
}
