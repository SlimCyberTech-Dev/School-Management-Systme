import type { Request, Response } from "express";
import * as svc from "./analytics.service";

export async function dashboard(_req: Request, res: Response): Promise<void> {
  const data = await svc.dashboardKpis();
  res.json({ success: true, data });
}

export async function classPerformance(req: Request, res: Response): Promise<void> {
  const classId = String(req.query["classId"] ?? "");
  const termId = String(req.query["termId"] ?? "");
  if (!classId || !termId) {
    res.status(400).json({ success: false, error: "classId and termId required" });
    return;
  }
  const data = await svc.classPerformance(classId, termId);
  res.json({ success: true, data });
}
