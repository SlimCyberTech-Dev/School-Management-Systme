import {
  DEFAULT_ASSESSMENT_GRADING_SCALES,
  resolveCaScore,
  finalOLevelSubjectGrade,
  type StrandRating,
} from "@uganda-cbc-sms/shared";
import { query } from "../config/db";
import { activeTenantIdFromContext } from "./activeTenant.js";
import { loadActiveGradingBands } from "./gradingScales";
import { loadAssessmentConfig } from "./assessmentConfig";
import { recomputeOlevelCertification } from "../modules/assessments/olevelCertification.service";

async function loadEocScores(
  studentId: string,
  academicYearId: string,
): Promise<Map<string, number>> {
  const { rows } = await query<{ subject_id: string; subject_code: string; score: string; max_score: string }>(
    `SELECT sub.id AS subject_id, sub.code AS subject_code,
            em.score::text AS score, e.max_score::text AS max_score
     FROM exam_marks em
     JOIN exams e ON e.id = em.exam_id
     JOIN subjects sub ON sub.id = em.subject_id
     WHERE em.student_id = $1
       AND e.academic_year_id = $2
       AND e.status IN ('open', 'closed')
     ORDER BY sub.code, e.exam_date DESC NULLS LAST`,
    [studentId, academicYearId],
  );
  const map = new Map<string, number>();
  for (const row of rows) {
    const code = row.subject_code.toUpperCase();
    if (map.has(code)) continue;
    const max = Number(row.max_score) || 100;
    const pct = (Number(row.score) / max) * 100;
    if (!Number.isNaN(pct)) map.set(code, Math.round(pct * 100) / 100);
  }
  return map;
}

async function loadCaRatingsBySubject(
  studentId: string,
  academicYearId: string,
): Promise<Map<string, StrandRating[]>> {
  const { rows } = await query<{ subject_code: string; strand: string; rating: string }>(
    `SELECT sub.code AS subject_code, ac.strand, ac.rating
     FROM assessments_cbc ac
     JOIN subjects sub ON sub.id = ac.subject_id
     WHERE ac.student_id = $1 AND ac.academic_year_id = $2`,
    [studentId, academicYearId],
  );
  const map = new Map<string, StrandRating[]>();
  for (const row of rows) {
    const code = row.subject_code.toUpperCase();
    const list = map.get(code) ?? [];
    list.push({ strand: row.strand, rating: row.rating });
    map.set(code, list);
  }
  return map;
}

async function loadProjectCompleteBySubject(
  studentId: string,
  academicYearId: string,
): Promise<Map<string, boolean>> {
  const { rows } = await query<{ subject_code: string; complete: boolean }>(
    `SELECT sub.code AS subject_code,
            BOOL_OR(COALESCE(p.status, 'recorded') <> 'incomplete') AS complete
     FROM assessments_cbc_project p
     JOIN subjects sub ON sub.id = p.subject_id
     WHERE p.student_id = $1 AND p.academic_year_id = $2
     GROUP BY sub.code`,
    [studentId, academicYearId],
  );
  const map = new Map<string, boolean>();
  for (const row of rows) {
    map.set(row.subject_code.toUpperCase(), Boolean(row.complete));
  }
  return map;
}

export async function recomputeOlevelSubjectResults(
  studentId: string,
  academicYearId: string,
  tenantId?: string,
): Promise<{ updated: number }> {
  const tid = tenantId ?? activeTenantIdFromContext();
  const config = await loadAssessmentConfig(tid);
  const bands = await loadActiveGradingBands("O_LEVEL");
  const scaleRows =
    bands.length > 0
      ? bands
      : DEFAULT_ASSESSMENT_GRADING_SCALES.O_LEVEL.map((r) => ({ ...r, isActive: true }));

  const caBySubject = await loadCaRatingsBySubject(studentId, academicYearId);
  const eocBySubject = await loadEocScores(studentId, academicYearId);
  const projectBySubject = await loadProjectCompleteBySubject(studentId, academicYearId);

  const subjectCodes = new Set<string>([
    ...caBySubject.keys(),
    ...eocBySubject.keys(),
    ...projectBySubject.keys(),
  ]);

  const { rows: subjectRows } = await query<{ id: string; code: string }>(
    `SELECT id, code FROM subjects WHERE UPPER(code) = ANY($1::text[])`,
    [Array.from(subjectCodes)],
  );
  const subjectIdByCode = new Map(subjectRows.map((r) => [r.code.toUpperCase(), r.id]));

  let updated = 0;
  for (const code of subjectCodes) {
    const subjectId = subjectIdByCode.get(code);
    if (!subjectId) continue;

    const ca = resolveCaScore(caBySubject.get(code) ?? [], config, code);
    const eocScore = eocBySubject.get(code) ?? null;
    const { finalGrade, compositeScore } = finalOLevelSubjectGrade(
      ca.score,
      eocScore,
      scaleRows,
      config,
    );
    const projectComplete = projectBySubject.get(code) ?? false;

    await query(
      `INSERT INTO olevel_subject_results (
         tenant_id, student_id, subject_id, academic_year_id,
         ca_score, eoc_score, composite_score, final_grade,
         ca_complete, project_complete, computed_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       ON CONFLICT (tenant_id, student_id, subject_id, academic_year_id) DO UPDATE SET
         ca_score = EXCLUDED.ca_score,
         eoc_score = EXCLUDED.eoc_score,
         composite_score = EXCLUDED.composite_score,
         final_grade = EXCLUDED.final_grade,
         ca_complete = EXCLUDED.ca_complete,
         project_complete = EXCLUDED.project_complete,
         computed_at = NOW()`,
      [
        tid,
        studentId,
        subjectId,
        academicYearId,
        ca.score,
        eocScore,
        compositeScore,
        finalGrade,
        ca.complete,
        projectComplete,
      ],
    );
    updated += 1;
  }

  await recomputeOlevelCertification(studentId, academicYearId, tid);
  return { updated };
}

export async function recomputeOlevelForClassYear(
  classId: string,
  academicYearId: string,
  tenantId?: string,
): Promise<{ students: number }> {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM students WHERE class_id = $1 AND status = 'active'`,
    [classId],
  );
  for (const st of rows) {
    await recomputeOlevelSubjectResults(st.id, academicYearId, tenantId);
  }
  return { students: rows.length };
}
