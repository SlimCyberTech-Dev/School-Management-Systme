import { query } from "../../config/db";
import { BULK_CHUNK_SIZE } from "../../utils/bulkConstants";
import { createGradingResolver } from "../../utils/gradingScales";
import { computeAlevelAggregate } from "../../utils/alevelDivision";

export type AlevelScoreInput = {
  studentId: string;
  subjectId: string;
  score: number;
};

export type ResolvedAlevelScore = AlevelScoreInput & {
  grade: string;
  points: number | null;
};

export function dedupeAlevelScores(items: AlevelScoreInput[]): AlevelScoreInput[] {
  const byKey = new Map<string, AlevelScoreInput>();
  for (const item of items) {
    byKey.set(`${item.studentId}:${item.subjectId}`, item);
  }
  return [...byKey.values()];
}

export async function bulkUpsertAlevelScores(
  items: ResolvedAlevelScore[],
  termId: string,
  yearId: string,
  teacherId: string,
): Promise<number> {
  if (items.length === 0) return 0;

  let saved = 0;
  for (let i = 0; i < items.length; i += BULK_CHUNK_SIZE) {
    const chunk = items.slice(i, i + BULK_CHUNK_SIZE);
    const studentIds = chunk.map((c) => c.studentId);
    const subjectIds = chunk.map((c) => c.subjectId);
    const scores = chunk.map((c) => c.score);
    const grades = chunk.map((c) => c.grade);
    const points = chunk.map((c) => c.points);

    const result = await query(
      `INSERT INTO assessments_alevel (
         student_id, subject_id, score, grade, points, term_id, academic_year_id, teacher_id, updated_at
       )
       SELECT u.student_id, u.subject_id, u.score, u.grade, u.points, $4, $5, $6, NOW()
       FROM UNNEST($1::uuid[], $2::uuid[], $3::numeric[], $7::text[], $8::int[]) AS u(
         student_id, subject_id, score, grade, points
       )
       ON CONFLICT (student_id, subject_id, term_id, academic_year_id) DO UPDATE SET
         score = EXCLUDED.score,
         grade = EXCLUDED.grade,
         points = EXCLUDED.points,
         teacher_id = EXCLUDED.teacher_id,
         updated_at = NOW()`,
      [studentIds, subjectIds, scores, termId, yearId, teacherId, grades, points],
    );
    saved += result.rowCount ?? chunk.length;
  }

  return saved;
}

export async function bulkRecalcAlevelDivisions(
  studentIds: string[],
  termId: string,
  yearId: string,
): Promise<number> {
  if (studentIds.length === 0) return 0;

  const uniqueIds = [...new Set(studentIds)];
  const { rows: pointRows } = await query<{ student_id: string; points: number }>(
    `SELECT student_id, points
     FROM assessments_alevel
     WHERE student_id = ANY($1::uuid[])
       AND term_id = $2
       AND academic_year_id = $3
       AND points IS NOT NULL`,
    [uniqueIds, termId, yearId],
  );

  const pointsByStudent = new Map<string, number[]>();
  for (const row of pointRows) {
    const list = pointsByStudent.get(row.student_id) ?? [];
    list.push(Number(row.points));
    pointsByStudent.set(row.student_id, list);
  }

  const { rows: comboRows } = await query<{ id: string; combination_id: string | null }>(
    `SELECT id, combination_id FROM students WHERE id = ANY($1::uuid[])`,
    [uniqueIds],
  );
  const comboByStudent = new Map(comboRows.map((r) => [r.id, r.combination_id]));

  const studentIdsOut: string[] = [];
  const combinationIds: Array<string | null> = [];
  const totalPoints: number[] = [];
  const divisions: string[] = [];

  for (const studentId of uniqueIds) {
    const aggregate = computeAlevelAggregate(pointsByStudent.get(studentId) ?? []);
    studentIdsOut.push(studentId);
    combinationIds.push(comboByStudent.get(studentId) ?? null);
    totalPoints.push(aggregate.totalPoints);
    divisions.push(aggregate.division);
  }

  let updated = 0;
  for (let i = 0; i < studentIdsOut.length; i += BULK_CHUNK_SIZE) {
    const chunkStudents = studentIdsOut.slice(i, i + BULK_CHUNK_SIZE);
    const chunkCombos = combinationIds.slice(i, i + BULK_CHUNK_SIZE);
    const chunkTotals = totalPoints.slice(i, i + BULK_CHUNK_SIZE);
    const chunkDivisions = divisions.slice(i, i + BULK_CHUNK_SIZE);

    const result = await query(
      `INSERT INTO student_division_summary (
         student_id, term_id, academic_year_id, combination_id, total_points, division, updated_at
       )
       SELECT u.student_id, $2, $3, u.combination_id, u.total_points, u.division, NOW()
       FROM UNNEST($1::uuid[], $4::uuid[], $5::int[], $6::text[]) AS u(
         student_id, combination_id, total_points, division
       )
       ON CONFLICT (student_id, term_id, academic_year_id) DO UPDATE SET
         combination_id = EXCLUDED.combination_id,
         total_points = EXCLUDED.total_points,
         division = EXCLUDED.division,
         updated_at = NOW()`,
      [chunkStudents, termId, yearId, chunkCombos, chunkTotals, chunkDivisions],
    );
    updated += result.rowCount ?? chunkStudents.length;
  }

  return updated;
}

export async function resolveAlevelScores(
  items: AlevelScoreInput[],
): Promise<ResolvedAlevelScore[]> {
  const resolver = await createGradingResolver("A_LEVEL");
  return dedupeAlevelScores(items).map((item) => {
    const { grade, points } = resolver(item.score);
    return { ...item, grade, points };
  });
}
