import { query } from "../../config/db";
import { HttpError } from "../../utils/httpError";
import { listExamsForReportOptions } from "../reports/reportExamLinkage";

export type TermResultStudentRow = {
  studentId: string;
  studentName: string;
  studentNumber: string;
  subjects: Array<{
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    examScores: Array<number | null>;
    examAverage: number | null;
    projectAverage: number | null;
    compositeScore: number | null;
    finalGrade: string | null;
    examBreakdown: unknown;
  }>;
  overallAverage: number | null;
};

export async function listTermResultsForClass(
  classId: string,
  termId: string,
): Promise<{
  examColumns: Array<{ examId: string; name: string; examDate: string | null }>;
  students: TermResultStudentRow[];
}> {
  const term = await query<{ academic_year_id: string }>(
    `SELECT academic_year_id FROM terms WHERE id = $1`,
    [termId],
  );
  if (term.rows.length === 0) {
    throw new HttpError(400, "Term not found.");
  }

  const examOptions = await listExamsForReportOptions(classId, termId);
  const examColumns = examOptions.map((e) => ({
    examId: e.id,
    name: e.name,
    examDate: e.examDate,
  }));
  const examOrder = examColumns.map((e) => e.examId);

  const { rows: students } = await query<{
    id: string;
    full_name: string;
    student_number: string;
  }>(
    `SELECT id, full_name, student_number
     FROM students
     WHERE class_id = $1 AND status = 'active'
     ORDER BY full_name`,
    [classId],
  );

  const { rows: results } = await query<{
    student_id: string;
    subject_id: string;
    subject_code: string;
    subject_name: string;
    exam_average: string | null;
    project_average: string | null;
    composite_score: string | null;
    final_grade: string | null;
    exam_breakdown: unknown;
  }>(
    `SELECT tsr.student_id, tsr.subject_id,
            sub.code AS subject_code, sub.name AS subject_name,
            tsr.exam_average::text, tsr.project_average::text,
            tsr.composite_score::text, tsr.final_grade,
            tsr.exam_breakdown
     FROM term_subject_results tsr
     JOIN subjects sub ON sub.id = tsr.subject_id
     WHERE tsr.term_id = $1
       AND tsr.student_id = ANY(
         SELECT id FROM students WHERE class_id = $2 AND status = 'active'
       )
     ORDER BY sub.code`,
    [termId, classId],
  );

  const byStudent = new Map<string, TermResultStudentRow>();

  for (const st of students) {
    byStudent.set(st.id, {
      studentId: st.id,
      studentName: st.full_name,
      studentNumber: st.student_number,
      subjects: [],
      overallAverage: null,
    });
  }

  for (const r of results) {
    const row = byStudent.get(r.student_id);
    if (!row) continue;

    const breakdown = Array.isArray(r.exam_breakdown)
      ? (r.exam_breakdown as Array<{ examId: string; scorePct: number }>)
      : [];
    const scoreByExam = new Map(breakdown.map((b) => [b.examId, b.scorePct]));
    const examScores = examOrder.map((id) => scoreByExam.get(id) ?? null);

    row.subjects.push({
      subjectId: r.subject_id,
      subjectCode: r.subject_code,
      subjectName: r.subject_name,
      examScores,
      examAverage: r.exam_average != null ? Number(r.exam_average) : null,
      projectAverage: r.project_average != null ? Number(r.project_average) : null,
      compositeScore: r.composite_score != null ? Number(r.composite_score) : null,
      finalGrade: r.final_grade,
      examBreakdown: breakdown,
    });
  }

  const studentRows = [...byStudent.values()].map((row) => {
    const composites = row.subjects
      .map((s) => s.compositeScore)
      .filter((c): c is number => c != null && !Number.isNaN(c));
    const overallAverage =
      composites.length > 0
        ? Math.round((composites.reduce((a, b) => a + b, 0) / composites.length) * 100) / 100
        : null;
    return { ...row, overallAverage };
  });

  return { examColumns, students: studentRows };
}
