import type { CbcRating } from "@uganda-cbc-sms/shared";
import { query } from "../config/db";

export type AssessmentsCbcRow = {
  studentId: string;
  subjectId: string;
  strand: string;
  competency: string;
  rating: CbcRating;
  termId: string;
  yearId: string;
  teacherId: string;
};

export type CbcScoresRow = {
  studentId: string;
  subjectId: string;
  strandId: string;
  competency: string;
  rating: CbcRating;
  termId: string;
  teacherId: string;
};

async function resolveStrandId(subjectId: string, strandName: string): Promise<string | null> {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM cbc_strands
     WHERE subject_id = $1
       AND (name = $2 OR strand_name = $2)
     ORDER BY created_at NULLS LAST
     LIMIT 1`,
    [subjectId, strandName],
  );
  return rows[0]?.id ?? null;
}

async function resolveStrandName(strandId: string): Promise<string | null> {
  const { rows } = await query<{ name: string | null; strand_name: string | null }>(
    `SELECT name, strand_name FROM cbc_strands WHERE id = $1`,
    [strandId],
  );
  const r = rows[0];
  if (!r) return null;
  return r.name ?? r.strand_name ?? "General";
}

async function resolveYearIdForTerm(termId: string): Promise<string | null> {
  const { rows } = await query<{ academic_year_id: string }>(
    `SELECT academic_year_id FROM terms WHERE id = $1`,
    [termId],
  );
  return rows[0]?.academic_year_id ?? null;
}

/** Mirror assessments_cbc row into legacy cbc_scores when strand can be resolved. */
export async function syncAssessmentsCbcToLegacy(row: AssessmentsCbcRow): Promise<void> {
  const strandId = await resolveStrandId(row.subjectId, row.strand);
  if (!strandId) return;

  await query(
    `INSERT INTO cbc_scores (
      student_id, subject_id, strand_id, term_id, competency, rating, teacher_id, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    ON CONFLICT (student_id, subject_id, strand_id, competency, term_id) DO UPDATE SET
      rating = EXCLUDED.rating,
      teacher_id = EXCLUDED.teacher_id,
      updated_at = NOW()`,
    [
      row.studentId,
      row.subjectId,
      strandId,
      row.termId,
      row.competency,
      row.rating,
      row.teacherId,
    ],
  );
}

/** Mirror legacy cbc_scores row into assessments_cbc when strand name + year resolve. */
export async function syncLegacyCbcToAssessments(row: CbcScoresRow): Promise<void> {
  const strandName = await resolveStrandName(row.strandId);
  const yearId = await resolveYearIdForTerm(row.termId);
  if (!strandName || !yearId) return;

  await query(
    `INSERT INTO assessments_cbc (
      student_id, subject_id, strand, competency, rating,
      term_id, academic_year_id, teacher_id, is_locked, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,NOW())
    ON CONFLICT (student_id, subject_id, strand, competency, term_id, academic_year_id) DO UPDATE SET
      rating = EXCLUDED.rating,
      teacher_id = EXCLUDED.teacher_id,
      updated_at = NOW()`,
    [
      row.studentId,
      row.subjectId,
      strandName,
      row.competency,
      row.rating,
      row.termId,
      yearId,
      row.teacherId,
    ],
  );
}

/** Dual-write legacy assessments_cbc + cbc_scores from authoritative UNEB letter grade. */
export async function dualWriteFromLetterGrade(input: {
  studentId: string;
  subjectId: string;
  strandName: string;
  competencyName: string;
  letterGrade: CbcRating;
  termId: string;
  yearId: string;
  teacherId: string;
}): Promise<void> {
  await query(
    `INSERT INTO assessments_cbc (
      student_id, subject_id, strand, competency, rating,
      term_id, academic_year_id, teacher_id, is_locked, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,NOW())
    ON CONFLICT (student_id, subject_id, strand, competency, term_id, academic_year_id) DO UPDATE SET
      rating = EXCLUDED.rating,
      teacher_id = EXCLUDED.teacher_id,
      updated_at = NOW()`,
    [
      input.studentId,
      input.subjectId,
      input.strandName,
      input.competencyName,
      input.letterGrade,
      input.termId,
      input.yearId,
      input.teacherId,
    ],
  );

  await syncAssessmentsCbcToLegacy({
    studentId: input.studentId,
    subjectId: input.subjectId,
    strand: input.strandName,
    competency: input.competencyName,
    rating: input.letterGrade,
    termId: input.termId,
    yearId: input.yearId,
    teacherId: input.teacherId,
  });
}
