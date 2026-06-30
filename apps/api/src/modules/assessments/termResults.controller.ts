import { z } from "zod";
import type { Request, Response } from "express";
import { HttpError } from "../../utils/httpError";
import { recalculateTermGrades } from "../../utils/termSubjectGrade";
import * as termResultsSvc from "./termResults.service";

const classTermQuery = z.object({
  classId: z.string().uuid(),
  termId: z.string().uuid(),
});

const recalcBody = z.object({
  classId: z.string().uuid().optional(),
  termId: z.string().uuid(),
  studentId: z.string().uuid().optional(),
});

export async function getTermResults(req: Request, res: Response) {
  const q = classTermQuery.parse(req.query);
  const data = await termResultsSvc.listTermResultsForClass(q.classId, q.termId);
  res.json({ success: true, data });
}

export async function recalculateTermResults(req: Request, res: Response) {
  const body = recalcBody.parse(req.body);
  if (!body.classId && !body.studentId) {
    throw new HttpError(400, "Provide classId or studentId for recalculation.");
  }
  const result = await recalculateTermGrades({
    classId: body.classId,
    termId: body.termId,
    studentId: body.studentId,
  });
  res.json({ success: true, data: result });
}
