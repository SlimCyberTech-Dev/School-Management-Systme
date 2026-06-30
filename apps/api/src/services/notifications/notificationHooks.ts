import { tenantContext, tenantQuery } from "../../config/db.js";
import {
  createNotification,
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
  const title = `Term ${ctx.term_number} ${ctx.subject_name} ${classLabel} competency ratings submitted`;
  const body = `Competency ratings for ${ctx.subject_name} (${classLabel}, Term ${ctx.term_number}) were submitted and are ready for your review.`;

  const headteachers = await listActiveHeadteacherIds(tenantId);
  if (headteachers.length === 0) return;

  await notifyUsers(headteachers, tenantId, {
    category: "assessment_submitted",
    title,
    body,
    link: "/headteacher/assessment/cbc",
    metadata: {
      subjectId: input.subjectId,
      classId: input.classId,
      termId: input.termId,
      yearId: input.yearId,
      submittedByUserId: input.submittedByUserId,
    },
  });
}

/** Headteacher term-summary override → notify assigned subject teacher. */
export async function notifyCompetencyOverride(
  tenantId: string,
  summaryId: string,
): Promise<void> {
  const { rows } = await tenantQuery<{
    subject_id: string;
    student_id: string;
    term_id: string;
    competency_name: string;
    overridden_grade: string | null;
    teacher_id: string | null;
    subject_name: string;
    student_name: string;
    class_name: string;
    class_stream: string | null;
    term_number: number;
  }>(
    tenantId,
    `SELECT
       tcs.subject_id,
       tcs.student_id,
       tcs.term_id,
       cc.name AS competency_name,
       tcs.overridden_grade::text AS overridden_grade,
       cs.teacher_id,
       subj.name AS subject_name,
       st.full_name AS student_name,
       c.name AS class_name,
       c.stream AS class_stream,
       tm.term_number
     FROM term_competency_summary tcs
     JOIN cbc_competencies cc ON cc.id = tcs.competency_id
     JOIN students st ON st.id = tcs.student_id
     JOIN classes c ON c.id = st.class_id
     JOIN subjects subj ON subj.id = tcs.subject_id
     JOIN terms tm ON tm.id = tcs.term_id
     LEFT JOIN class_subjects cs
       ON cs.class_id = st.class_id
      AND cs.subject_id = tcs.subject_id
      AND cs.academic_year_id = tm.academic_year_id
     WHERE tcs.id = $1`,
    [summaryId],
  );

  const ctx = rows[0];
  if (!ctx?.teacher_id) return;

  const classLabel = formatClassLabel(ctx.class_name, ctx.class_stream);
  const level = ctx.overridden_grade ?? "updated";
  const title = `Competency rating adjusted for ${ctx.student_name}`;
  const body = `The headteacher set ${ctx.competency_name} (${ctx.subject_name}, ${classLabel}, Term ${ctx.term_number}) to ${level} for ${ctx.student_name}.`;

  await createNotification({
    userId: ctx.teacher_id,
    tenantId,
    category: "competency_override",
    title,
    body,
    link: "/subject-teacher/assessment/cbc",
    metadata: {
      summaryId,
      studentId: ctx.student_id,
      subjectId: ctx.subject_id,
      termId: ctx.term_id,
      overriddenGrade: ctx.overridden_grade,
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

export function fireCompetencyOverrideNotification(tenantId: string, summaryId: string): void {
  runNotificationHook(tenantId, () => notifyCompetencyOverride(tenantId, summaryId));
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
