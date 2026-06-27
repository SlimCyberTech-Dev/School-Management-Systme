import type { Request, Response } from "express";
import {
  cbcActivityCreateSchema,
  cbcCompetencyRatingsBulkSchema,
  cbcLearningOutcomeCreateSchema,
  cbcLearningOutcomeRecordCreateSchema,
  cbcTermSummaryOverrideSchema,
  cbcTermSummaryQuerySchema,
} from "@uganda-cbc-sms/shared";
import { query } from "../../config/db";
import { HttpError } from "../../utils/httpError";
import {
  assertTeacherOwnsClassSubject,
  assertTeacherOwnsStudentSubject,
} from "./assessmentAccess";
import * as svc from "./cbcCompetency.service";

async function resolveClassForSubjectTeacher(
  teacherId: string,
  subjectId: string,
  yearId: string,
): Promise<string> {
  const { rows } = await query<{ class_id: string }>(
    `SELECT class_id FROM class_subjects
     WHERE teacher_id = $1 AND subject_id = $2 AND academic_year_id = $3
     LIMIT 1`,
    [teacherId, subjectId, yearId],
  );
  if (!rows[0]) {
    throw new HttpError(
      403,
      "You are not assigned to teach this subject for the selected academic year",
    );
  }
  return rows[0].class_id;
}

export async function postCbcActivity(req: Request, res: Response) {
  const body = cbcActivityCreateSchema.parse(req.body);
  await assertTeacherOwnsClassSubject(
    req.user!.id,
    body.classId,
    body.subjectId,
    body.academicYearId,
  );
  const row = await svc.createAssessmentActivity(body, req.user!.id);
  res.status(201).json({ success: true, data: row });
}

export async function postCbcRatings(req: Request, res: Response) {
  const body = cbcCompetencyRatingsBulkSchema.parse(req.body);
  const activity = await svc.getAssessmentActivity(body.assessmentActivityId);
  await assertTeacherOwnsClassSubject(
    req.user!.id,
    activity.class_id,
    activity.subject_id,
    activity.academic_year_id,
  );
  const out = await svc.bulkInsertCompetencyRatings(body, req.user!.id);
  res.status(201).json({ success: true, data: out });
}

export async function getCbcTermSummary(req: Request, res: Response) {
  const q = cbcTermSummaryQuerySchema.parse({
    studentId: req.query["studentId"],
    subjectId: req.query["subjectId"],
    termId: req.query["termId"],
  });
  const rows = await svc.computeAndCacheTermSummaries(q.studentId, q.subjectId, q.termId);
  res.json({ success: true, data: rows });
}

export async function patchCbcTermSummaryOverride(req: Request, res: Response) {
  const body = cbcTermSummaryOverrideSchema.parse(req.body);
  const row = await svc.overrideTermSummary(
    req.params["id"]!,
    body.overriddenLevel,
    body.overrideJustification,
    req.user!.id,
  );
  res.json({ success: true, data: row });
}

export async function patchCbcActivityLock(req: Request, res: Response) {
  const activity = await svc.getAssessmentActivity(req.params["id"]!);
  await assertTeacherOwnsClassSubject(
    req.user!.id,
    activity.class_id,
    activity.subject_id,
    activity.academic_year_id,
  );
  const row = await svc.lockAssessmentActivity(req.params["id"]!, req.user!.id);
  res.json({ success: true, data: row });
}

export async function postCbcLearningOutcome(req: Request, res: Response) {
  const body = cbcLearningOutcomeCreateSchema.parse(req.body);
  const { rows: termRows } = await query<{ academic_year_id: string }>(
    `SELECT academic_year_id FROM terms WHERE id = $1`,
    [body.termId],
  );
  if (!termRows[0]) throw new HttpError(400, "Invalid term");

  const classId = await resolveClassForSubjectTeacher(
    req.user!.id,
    body.subjectId,
    termRows[0].academic_year_id,
  );
  await assertTeacherOwnsClassSubject(
    req.user!.id,
    classId,
    body.subjectId,
    termRows[0].academic_year_id,
  );

  const row = await svc.createLearningOutcome(body, req.user!.id);
  res.status(201).json({ success: true, data: row });
}

export async function postCbcLearningOutcomeRecord(req: Request, res: Response) {
  const body = cbcLearningOutcomeRecordCreateSchema.parse(req.body);
  const { rows: outcome } = await query<{ subject_id: string; term_id: string }>(
    `SELECT subject_id, term_id FROM learning_outcomes WHERE id = $1`,
    [body.learningOutcomeId],
  );
  if (!outcome[0]) throw new HttpError(404, "Learning outcome not found");

  const { rows: termRows } = await query<{ academic_year_id: string }>(
    `SELECT academic_year_id FROM terms WHERE id = $1`,
    [outcome[0].term_id],
  );
  if (!termRows[0]) throw new HttpError(400, "Invalid term on learning outcome");

  await assertTeacherOwnsStudentSubject(
    req.user!.id,
    body.studentId,
    outcome[0].subject_id,
    termRows[0].academic_year_id,
  );

  const row = await svc.createLearningOutcomeRecord(body);
  res.status(201).json({ success: true, data: row });
}
