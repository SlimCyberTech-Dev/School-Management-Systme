import { query } from "../../config/db";
import { HttpError } from "../../utils/httpError";
import type { GradingResolver } from "../../utils/gradingScales";

import { BULK_CHUNK_SIZE } from "../../utils/bulkConstants";

type MarkInput = { studentId: string; score: number };

type ResolvedMark = {
  studentId: string;
  score: number;
  grade: string;
  points: number | null;
};

/** One query: registered for paper, active, and in the exam class. */
export async function validateEligibleMarkStudents(
  examId: string,
  subjectId: string,
  classId: string,
  studentIds: string[],
): Promise<void> {
  if (studentIds.length === 0) return;

  const uniqueIds = [...new Set(studentIds)];
  const { rows } = await query<{ student_id: string }>(
    `SELECT ese.student_id
     FROM exam_student_entries ese
     INNER JOIN students st ON st.id = ese.student_id
       AND st.class_id = $3
       AND st.status = 'active'
     WHERE ese.exam_id = $1
       AND ese.subject_id = $2
       AND ese.student_id = ANY($4::uuid[])`,
    [examId, subjectId, classId, uniqueIds],
  );

  if (rows.length !== uniqueIds.length) {
    throw new HttpError(
      400,
      "One or more students are not registered for this exam paper or are not active in this class. Update student entries before saving marks.",
    );
  }
}

function dedupeMarks(marks: MarkInput[]): ResolvedMark[] {
  const byStudent = new Map<string, number>();
  for (const m of marks) {
    byStudent.set(m.studentId, m.score);
  }
  return [...byStudent.entries()].map(([studentId, score]) => ({
    studentId,
    score,
    grade: "",
    points: null as number | null,
  }));
}

export function resolveMarkGrades(
  marks: MarkInput[],
  resolveGrade: GradingResolver,
): ResolvedMark[] {
  return dedupeMarks(marks).map((row) => {
    const { grade, points } = resolveGrade(row.score);
    return { ...row, grade, points };
  });
}

export async function bulkUpsertExamMarks(
  examId: string,
  subjectId: string,
  teacherId: string,
  resolved: ResolvedMark[],
): Promise<number> {
  if (resolved.length === 0) return 0;

  let saved = 0;
  for (let i = 0; i < resolved.length; i += BULK_CHUNK_SIZE) {
    const chunk = resolved.slice(i, i + BULK_CHUNK_SIZE);
    const studentIds = chunk.map((c) => c.studentId);
    const scores = chunk.map((c) => c.score);
    const grades = chunk.map((c) => c.grade);
    const points = chunk.map((c) => c.points);

    const result = await query(
      `INSERT INTO exam_marks (exam_id, student_id, subject_id, score, grade, points, teacher_id, updated_at)
       SELECT $1, u.student_id, $2, u.score, u.grade, u.points, $3, NOW()
       FROM UNNEST($4::uuid[], $5::numeric[], $6::text[], $7::int[]) AS u(student_id, score, grade, points)
       ON CONFLICT (exam_id, student_id, subject_id) DO UPDATE SET
         score = EXCLUDED.score,
         grade = EXCLUDED.grade,
         points = EXCLUDED.points,
         teacher_id = EXCLUDED.teacher_id,
         updated_at = NOW()
       WHERE exam_marks.is_locked = false`,
      [examId, subjectId, teacherId, studentIds, scores, grades, points],
    );
    saved += result.rowCount ?? chunk.length;
  }

  return saved;
}

type SubmitReadiness = {
  subjectOnExam: boolean;
  isSubmitted: boolean;
  entrants: number;
  missing: number;
};

/** Single round-trip for submit pre-checks. */
export async function loadExamMarksSubmitReadiness(
  examId: string,
  subjectId: string,
): Promise<SubmitReadiness> {
  const { rows } = await query<{
    subject_on_exam: boolean;
    is_submitted: boolean | null;
    entrants: number;
    missing: number;
  }>(
    `SELECT
       EXISTS (
         SELECT 1 FROM exam_subjects WHERE exam_id = $1 AND subject_id = $2
       ) AS subject_on_exam,
       ess.is_submitted,
       (
         SELECT COUNT(*)::int
         FROM exam_student_entries
         WHERE exam_id = $1 AND subject_id = $2
       ) AS entrants,
       (
         SELECT COUNT(*)::int
         FROM exam_student_entries ese
         LEFT JOIN exam_marks em
           ON em.exam_id = ese.exam_id
          AND em.student_id = ese.student_id
          AND em.subject_id = ese.subject_id
         WHERE ese.exam_id = $1
           AND ese.subject_id = $2
           AND em.id IS NULL
       ) AS missing
     FROM exam_subjects es
     LEFT JOIN exam_subject_submissions ess
       ON ess.exam_id = es.exam_id AND ess.subject_id = es.subject_id
     WHERE es.exam_id = $1 AND es.subject_id = $2
     LIMIT 1`,
    [examId, subjectId],
  );

  const row = rows[0];
  return {
    subjectOnExam: Boolean(row?.subject_on_exam),
    isSubmitted: Boolean(row?.is_submitted),
    entrants: row?.entrants ?? 0,
    missing: row?.missing ?? 0,
  };
}

export async function finalizeExamMarksSubmission(
  examId: string,
  subjectId: string,
  teacherId: string,
): Promise<void> {
  await Promise.all([
    query(
      `INSERT INTO exam_subject_submissions (exam_id, subject_id, is_submitted, submitted_at, submitted_by)
       VALUES ($1, $2, true, NOW(), $3)
       ON CONFLICT (exam_id, subject_id) DO UPDATE SET
         is_submitted = true, submitted_at = NOW(), submitted_by = EXCLUDED.submitted_by`,
      [examId, subjectId, teacherId],
    ),
    query(
      `UPDATE exam_marks SET is_locked = true, updated_at = NOW()
       WHERE exam_id = $1 AND subject_id = $2`,
      [examId, subjectId],
    ),
  ]);
}
