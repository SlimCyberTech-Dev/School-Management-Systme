import { tenantContext, tenantQuery } from "../../config/db.js";
import {
  listActiveHeadteacherIds,
  notifyUsers,
} from "./notificationService.js";

function formatClassLabel(name: string, stream: string | null | undefined): string {
  const base = name.trim();
  const s = stream?.trim();
  return s ? `${base}${s}` : base;
}

function logHookError(event: string, err: unknown): void {
  console.error(
    `[notifications] ${event} hook failed:`,
    err instanceof Error ? err.message : err,
  );
}

function runNotificationHook(tenantId: string, task: () => Promise<void>): void {
  void tenantContext.run(tenantId, async () => {
    try {
      await task();
    } catch (err) {
      logHookError("hook", err);
    }
  });
}

/** Legacy CBC sheet submit → notify headteacher(s). */
export async function notifyAssessmentSubmitted(input: {
  tenantId: string;
  subjectId: string;
  classId: string;
  termId: string;
  yearId: string;
  submittedByUserId: string;
}): Promise<void> {
  const { tenantId } = input;

  const { rows } = await tenantQuery<{
    class_name: string;
    class_stream: string | null;
    subject_name: string;
    term_number: number;
  }>(
    tenantId,
    `SELECT c.name AS class_name, c.stream AS class_stream, s.name AS subject_name, t.term_number
     FROM classes c, subjects s, terms t
     WHERE c.id = $1 AND s.id = $2 AND t.id = $3`,
    [input.classId, input.subjectId, input.termId],
  );
  const ctx = rows[0];
  if (!ctx) return;

  const classLabel = formatClassLabel(ctx.class_name, ctx.class_stream);
  const title = `Term ${ctx.term_number} ${ctx.subject_name} ${classLabel} exam marks submitted`;
  const body = `Exam marks for ${ctx.subject_name} (${classLabel}, Term ${ctx.term_number}) were submitted and are ready for your review.`;

  const headteachers = await listActiveHeadteacherIds(tenantId);
  if (headteachers.length === 0) return;

  await notifyUsers(headteachers, tenantId, {
    category: "assessment_submitted",
    title,
    body,
    link: "/headteacher/exams",
    metadata: {
      subjectId: input.subjectId,
      classId: input.classId,
      termId: input.termId,
      yearId: input.yearId,
      submittedByUserId: input.submittedByUserId,
    },
  });
}

/** Exam subject marks submitted → notify headteacher(s). */
export async function notifyExamMarksSubmitted(input: {
  tenantId: string;
  examId: string;
  subjectId: string;
  submittedByUserId: string;
}): Promise<void> {
  const { tenantId } = input;

  const { rows } = await tenantQuery<{
    exam_name: string;
    class_name: string;
    class_stream: string | null;
    subject_name: string;
    term_number: number;
  }>(
    tenantId,
    `SELECT
       e.name AS exam_name,
       c.name AS class_name,
       c.stream AS class_stream,
       s.name AS subject_name,
       t.term_number
     FROM exams e
     JOIN classes c ON c.id = e.class_id
     JOIN subjects s ON s.id = $2
     JOIN terms t ON t.id = e.term_id
     WHERE e.id = $1`,
    [input.examId, input.subjectId],
  );

  const ctx = rows[0];
  if (!ctx) return;

  const classLabel = formatClassLabel(ctx.class_name, ctx.class_stream);
  const title = `Term ${ctx.term_number} ${ctx.subject_name} ${classLabel} exam marks submitted`;
  const body = `${ctx.subject_name} marks for ${ctx.exam_name} (${classLabel}, Term ${ctx.term_number}) were submitted and locked for review.`;

  const headteachers = await listActiveHeadteacherIds(tenantId);
  if (headteachers.length === 0) return;

  await notifyUsers(headteachers, tenantId, {
    category: "exam_marks_submitted",
    title,
    body,
    link: "/headteacher/exams",
    metadata: {
      examId: input.examId,
      subjectId: input.subjectId,
      submittedByUserId: input.submittedByUserId,
    },
  });
}

export function fireAssessmentSubmittedNotification(input: {
  tenantId: string;
  subjectId: string;
  classId: string;
  termId: string;
  yearId: string;
  submittedByUserId: string;
}): void {
  const { tenantId, ...rest } = input;
  runNotificationHook(tenantId, () => notifyAssessmentSubmitted({ tenantId, ...rest }));
}

export function fireExamMarksSubmittedNotification(input: {
  tenantId: string;
  examId: string;
  subjectId: string;
  submittedByUserId: string;
}): void {
  const { tenantId, ...rest } = input;
  runNotificationHook(tenantId, () => notifyExamMarksSubmitted({ tenantId, ...rest }));
}
