import { query } from "../../config/db";
import { BULK_CHUNK_SIZE } from "../../utils/bulkConstants";
import { HttpError } from "../../utils/httpError";

export type ExamEntryInput = {
  studentId: string;
  subjectId: string;
  isEntered: boolean;
};

export function partitionExamEntries(entries: ExamEntryInput[]): {
  inserts: Array<{ studentId: string; subjectId: string }>;
  removes: Array<{ studentId: string; subjectId: string }>;
} {
  const insertMap = new Map<string, { studentId: string; subjectId: string }>();
  const removeMap = new Map<string, { studentId: string; subjectId: string }>();

  for (const entry of entries) {
    const key = `${entry.studentId}:${entry.subjectId}`;
    if (entry.isEntered) {
      insertMap.set(key, { studentId: entry.studentId, subjectId: entry.subjectId });
      removeMap.delete(key);
    } else {
      removeMap.set(key, { studentId: entry.studentId, subjectId: entry.subjectId });
      insertMap.delete(key);
    }
  }

  return {
    inserts: [...insertMap.values()],
    removes: [...removeMap.values()],
  };
}

export function validateExamEntryBatch(
  entries: ExamEntryInput[],
  subjectIds: Set<string>,
  compulsoryIds: Set<string>,
): void {
  for (const item of entries) {
    if (!subjectIds.has(item.subjectId)) {
      throw new HttpError(400, "One of the subjects is not part of this exam.");
    }
    if (!item.isEntered && compulsoryIds.has(item.subjectId)) {
      throw new HttpError(
        400,
        "Compulsory papers must include every student in the class. Mark the paper as optional in exam settings instead.",
      );
    }
  }
}

export async function bulkInsertExamEntries(
  examId: string,
  inserts: Array<{ studentId: string; subjectId: string }>,
): Promise<number> {
  if (inserts.length === 0) return 0;

  let changed = 0;
  for (let i = 0; i < inserts.length; i += BULK_CHUNK_SIZE) {
    const chunk = inserts.slice(i, i + BULK_CHUNK_SIZE);
    const studentIds = chunk.map((c) => c.studentId);
    const subjectIds = chunk.map((c) => c.subjectId);

    const result = await query(
      `INSERT INTO exam_student_entries (exam_id, student_id, subject_id)
       SELECT $1, u.student_id, u.subject_id
       FROM UNNEST($2::uuid[], $3::uuid[]) AS u(student_id, subject_id)
       ON CONFLICT DO NOTHING`,
      [examId, studentIds, subjectIds],
    );
    changed += result.rowCount ?? chunk.length;
  }

  return changed;
}

export async function bulkRemoveExamEntries(
  examId: string,
  removes: Array<{ studentId: string; subjectId: string }>,
): Promise<number> {
  if (removes.length === 0) return 0;

  let changed = 0;
  for (let i = 0; i < removes.length; i += BULK_CHUNK_SIZE) {
    const chunk = removes.slice(i, i + BULK_CHUNK_SIZE);
    const studentIds = chunk.map((c) => c.studentId);
    const subjectIds = chunk.map((c) => c.subjectId);

    await query(
      `DELETE FROM exam_marks em
       USING UNNEST($2::uuid[], $3::uuid[]) AS u(student_id, subject_id)
       WHERE em.exam_id = $1
         AND em.student_id = u.student_id
         AND em.subject_id = u.subject_id`,
      [examId, studentIds, subjectIds],
    );
    const result = await query(
      `DELETE FROM exam_student_entries ese
       USING UNNEST($2::uuid[], $3::uuid[]) AS u(student_id, subject_id)
       WHERE ese.exam_id = $1
         AND ese.student_id = u.student_id
         AND ese.subject_id = u.subject_id`,
      [examId, studentIds, subjectIds],
    );
    changed += result.rowCount ?? chunk.length;
  }

  return changed;
}
