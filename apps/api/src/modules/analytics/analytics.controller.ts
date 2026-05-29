import type { Request, Response } from "express";
import { activeTenantId } from "../../utils/activeTenant.js";
import * as svc from "./analytics.service";

export async function dashboard(req: Request, res: Response): Promise<void> {
  const tenantId = activeTenantId(req);
  const data = await svc.dashboardKpis(tenantId);
  res.json({ success: true, data });
}

export async function classPerformance(req: Request, res: Response): Promise<void> {
  const classId = String(req.query["classId"] ?? "");
  const termId = String(req.query["termId"] ?? "");
  if (!classId || !termId) {
    res.status(400).json({ success: false, error: "classId and termId required" });
    return;
  }
  const data = await svc.classPerformance(classId, termId, activeTenantId(req));
  res.json({ success: true, data });
}

export async function reportPipeline(req: Request, res: Response): Promise<void> {
  const classId = String(req.query["classId"] ?? "");
  const termId = String(req.query["termId"] ?? "");
  if (!classId || !termId) {
    res.status(400).json({ success: false, error: "classId and termId required" });
    return;
  }
  const data = await svc.reportPipeline(classId, termId, activeTenantId(req));
  res.json({ success: true, data });
}

export async function reportsOverview(req: Request, res: Response): Promise<void> {
  const classId = String(req.query["classId"] ?? "");
  const termId = String(req.query["termId"] ?? "");
  const yearId = String(req.query["yearId"] ?? "");
  if (!classId || !termId || !yearId) {
    res.status(400).json({ success: false, error: "classId, termId and yearId required" });
    return;
  }
  const data = await svc.reportsOverview(classId, termId, yearId, activeTenantId(req));
  res.json({ success: true, data });
}
