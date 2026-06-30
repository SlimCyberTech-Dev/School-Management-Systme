import { query } from "../../config/db";
import { BULK_CHUNK_SIZE } from "../../utils/bulkConstants";

export type ProjectWorkScoreInput = {
  studentId: string;
  projectNumber: number;
  score: number | null;
  maxScore?: number;
};

export type ResolvedProjectWorkScore = {
  studentId: string;
  projectNumber: number;
  score: number;
  maxScore: number;
};

export type ProjectWorkDeleteKey = {
  studentId: string;
  projectNumber: number;
};

/** Last write wins per student + project slot. */
export function partitionProjectWorkScores(scores: ProjectWorkScoreInput[]): {
  upserts: ResolvedProjectWorkScore[];
  deletes: ProjectWorkDeleteKey[];
} {
  const upsertMap = new Map<string, ResolvedProjectWorkScore>();
  const deleteMap = new Map<string, ProjectWorkDeleteKey>();

  for (const item of scores) {
    const key = `${item.studentId}:${item.projectNumber}`;
    if (item.score == null) {
      deleteMap.set(key, { studentId: item.studentId, projectNumber: item.projectNumber });
      upsertMap.delete(key);
      continue;
    }
    upsertMap.set(key, {
      studentId: item.studentId,
      projectNumber: item.projectNumber,
      score: item.score,
      maxScore: item.maxScore ?? 100,
    });
    deleteMap.delete(key);
  }

  return {
    upserts: [...upsertMap.values()],
    deletes: [...deleteMap.values()],
  };
}

export async function bulkDeleteProjectWorkScores(
  classSubjectId: string,
  termId: string,
  deletes: ProjectWorkDeleteKey[],
): Promise<number> {
  if (deletes.length === 0) return 0;

  let deleted = 0;
  for (let i = 0; i < deletes.length; i += BULK_CHUNK_SIZE) {
    const chunk = deletes.slice(i, i + BULK_CHUNK_SIZE);
    const studentIds = chunk.map((c) => c.studentId);
    const projectNumbers = chunk.map((c) => c.projectNumber);

    const result = await query(
      `DELETE FROM project_work_scores pws
       USING UNNEST($1::uuid[], $2::int[]) AS u(student_id, project_number)
       WHERE pws.class_subject_id = $3
         AND pws.term_id = $4
         AND pws.student_id = u.student_id
         AND pws.project_number = u.project_number`,
      [studentIds, projectNumbers, classSubjectId, termId],
    );
    deleted += result.rowCount ?? 0;
  }

  return deleted;
}

export async function bulkUpsertProjectWorkScores(
  classSubjectId: string,
  termId: string,
  teacherId: string,
  upserts: ResolvedProjectWorkScore[],
): Promise<number> {
  if (upserts.length === 0) return 0;

  let saved = 0;
  for (let i = 0; i < upserts.length; i += BULK_CHUNK_SIZE) {
    const chunk = upserts.slice(i, i + BULK_CHUNK_SIZE);
    const studentIds = chunk.map((c) => c.studentId);
    const projectNumbers = chunk.map((c) => c.projectNumber);
    const scores = chunk.map((c) => c.score);
    const maxScores = chunk.map((c) => c.maxScore);

    const result = await query(
      `INSERT INTO project_work_scores (
         student_id, class_subject_id, term_id, project_number,
         score, max_score, scored_by, scored_at, updated_at
       )
       SELECT u.student_id, $2, $3, u.project_number, u.score, u.max_score, $4, NOW(), NOW()
       FROM UNNEST($1::uuid[], $5::int[], $6::numeric[], $7::numeric[]) AS u(
         student_id, project_number, score, max_score
       )
       ON CONFLICT (tenant_id, student_id, class_subject_id, term_id, project_number)
       DO UPDATE SET
         score = EXCLUDED.score,
         max_score = EXCLUDED.max_score,
         scored_by = EXCLUDED.scored_by,
         scored_at = NOW(),
         updated_at = NOW()`,
      [studentIds, classSubjectId, termId, teacherId, projectNumbers, scores, maxScores],
    );
    saved += result.rowCount ?? chunk.length;
  }

  return saved;
}
