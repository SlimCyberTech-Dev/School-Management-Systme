import type { Request, Response } from "express";
import { alevelScoreUpsertSchema } from "@uganda-cbc-sms/shared";
import * as svc from "./alevel.service";

export async function postAlevel(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }
  const body = alevelScoreUpsertSchema.parse(req.body);
  const r = await svc.upsertAlevelScore(body, req.user.id);
  res.status(201).json({ success: true, data: r });
}

export async function getAlevel(req: Request, res: Response): Promise<void> {
  const classId = req.query["classId"] as string | undefined;
  const subjectId = req.query["subjectId"] as string | undefined;
  const termId = req.query["termId"] as string | undefined;
  const rows = await svc.listAlevelScores({ classId, subjectId, termId });
  res.json({ success: true, data: rows });
}
