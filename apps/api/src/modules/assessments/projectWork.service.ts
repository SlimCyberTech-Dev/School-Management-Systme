import { query } from "../../config/db";
import { HttpError } from "../../utils/httpError";
import { scheduleTermRecompute } from "../../utils/termRecomputeSchedule";
import { validateActiveClassStudents } from "../../utils/rosterValidation";
import { assertTeacherIsAssignedSubjectTeacher } from "../../utils/teacherTeachingAccess";
import {
  bulkDeleteProjectWorkScores,
  bulkUpsertProjectWorkScores,
  partitionProjectWorkScores,
} from "./projectWorkBulk";

export type ProjectWorkRow = {
  id: string;
  studentId: string;
  classSubjectId: string;
  termId: string;
  projectNumber: number;
  score: number;
  maxScore: number;
  scoredBy: string;
  scoredAt: string;
  evidenceRef: string | null;
  notes: string | null;
  studentName?: string;
  studentNumber?: string;
};

async function resolveClassSubjectId(
  classId: string,
  subjectId: string,
  yearId: string,
): Promise<string> {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM class_subjects
     WHERE class_id = $1 AND subject_id = $2 AND academic_year_id = $3
     LIMIT 1`,
    [classId, subjectId, yearId],
  );
  if (!rows[0]) {
    throw new HttpError(400, "Class subject assignment not found for this class and subject");
  }
  return rows[0].id;
}

export async function listProjectWork(filters: {
  classId?: string;
  subjectId?: string;
  termId?: string;
  yearId?: string;
}): Promise<ProjectWorkRow[]> {
  const where: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (filters.classId) {
    where.push(`st.class_id = $${i++}`);
    values.push(filters.classId);
  }
  if (filters.subjectId) {
    where.push(`cs.subject_id = $${i++}`);
    values.push(filters.subjectId);
  }
  if (filters.termId) {
    where.push(`pws.term_id = $${i++}`);
    values.push(filters.termId);
  }
  if (filters.yearId) {
    where.push(`cs.academic_year_id = $${i++}`);
    values.push(filters.yearId);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const { rows } = await query(
    `SELECT
       pws.id,
       pws.student_id,
       pws.class_subject_id,
       pws.term_id,
       pws.project_number,
       pws.score::text,
       pws.max_score::text,
       pws.scored_by,
       pws.scored_at,
       pws.evidence_ref,
       pws.notes,
       st.full_name AS student_name,
       st.student_number
     FROM project_work_scores pws
     JOIN students st ON st.id = pws.student_id
     JOIN class_subjects cs ON cs.id = pws.class_subject_id
     ${clause}
     ORDER BY st.full_name, pws.project_number`,
    values,
  );
  return rows.map((r) => {
    const x = r as Record<string, unknown>;
    return {
      id: String(x["id"]),
      studentId: String(x["student_id"]),
      classSubjectId: String(x["class_subject_id"]),
      termId: String(x["term_id"]),
      projectNumber: Number(x["project_number"]),
      score: Number(x["score"]),
      maxScore: Number(x["max_score"]),
      scoredBy: String(x["scored_by"]),
      scoredAt: new Date(String(x["scored_at"])).toISOString(),
      evidenceRef: x["evidence_ref"] != null ? String(x["evidence_ref"]) : null,
      notes: x["notes"] != null ? String(x["notes"]) : null,
      studentName: x["student_name"] != null ? String(x["student_name"]) : undefined,
      studentNumber: x["student_number"] != null ? String(x["student_number"]) : undefined,
    };
  });
}

export async function upsertProjectWorkBulk(
  input: {
    classId: string;
    subjectId: string;
    termId: string;
    yearId: string;
    scores: Array<{
      studentId: string;
      projectNumber: number;
      score: number | null;
      maxScore?: number;
    }>;
  },
  teacherId: string,
): Promise<{ saved: number; deleted: number }> {
  const { upserts, deletes } = partitionProjectWorkScores(input.scores);

  for (const item of upserts) {
    if (item.score > item.maxScore) {
      throw new HttpError(
        400,
        `Project ${item.projectNumber} score cannot exceed the maximum (${item.maxScore}).`,
      );
    }
  }

  const studentIds = [...new Set([...upserts.map((u) => u.studentId), ...deletes.map((d) => d.studentId)])];

  const [classSubjectId] = await Promise.all([
    resolveClassSubjectId(input.classId, input.subjectId, input.yearId),
    assertTeacherIsAssignedSubjectTeacher(
      teacherId,
      input.classId,
      input.subjectId,
      input.yearId,
    ),
    validateActiveClassStudents(input.classId, studentIds),
  ]);

  const [saved, deleted] = await Promise.all([
    bulkUpsertProjectWorkScores(classSubjectId, input.termId, teacherId, upserts),
    bulkDeleteProjectWorkScores(classSubjectId, input.termId, deletes),
  ]);

  scheduleTermRecompute(input.classId, input.termId);
  return { saved, deleted };
}
