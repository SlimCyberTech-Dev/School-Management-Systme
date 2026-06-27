import type { CompetencyLevel } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import {
  cbcActivityCreateSchema,
  cbcCompetencyRatingsBulkSchema,
  cbcLearningOutcomeCreateSchema,
  cbcLearningOutcomeRecordCreateSchema,
} from "@uganda-cbc-sms/shared";
import { query } from "../../config/db";
import { aggregateTermCompetencyLevel } from "../../services/cbcCompetencyAggregation";
import { dualWriteFromCompetencyRatingIds } from "../../utils/cbcRatingWrite";
import { HttpError } from "../../utils/httpError";

type ActivityIn = z.infer<typeof cbcActivityCreateSchema>;
type RatingsBulkIn = z.infer<typeof cbcCompetencyRatingsBulkSchema>;
type LearningOutcomeIn = z.infer<typeof cbcLearningOutcomeCreateSchema>;
type LearningOutcomeRecordIn = z.infer<typeof cbcLearningOutcomeRecordCreateSchema>;

type ActivityRow = {
  id: string;
  subject_id: string;
  class_id: string;
  term_id: string;
  academic_year_id: string;
  teacher_id: string;
  activity_type: string;
  title: string;
  activity_date: string;
  is_locked: boolean;
  locked_at: string | null;
  created_at: string;
};

export async function createAssessmentActivity(input: ActivityIn, teacherId: string) {
  const { rows } = await query<ActivityRow>(
    `INSERT INTO assessment_activities (
      subject_id, class_id, term_id, academic_year_id, teacher_id,
      activity_type, title, activity_date
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::date)
    RETURNING *`,
    [
      input.subjectId,
      input.classId,
      input.termId,
      input.academicYearId,
      teacherId,
      input.activityType,
      input.title,
      input.activityDate,
    ],
  );
  return rows[0];
}

export async function getAssessmentActivity(activityId: string): Promise<ActivityRow> {
  const { rows } = await query<ActivityRow>(
    `SELECT * FROM assessment_activities WHERE id = $1`,
    [activityId],
  );
  if (!rows[0]) throw new HttpError(404, "Assessment activity not found");
  return rows[0];
}

export async function assertStudentsInClass(studentIds: string[], classId: string) {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM students WHERE id = ANY($1::uuid[]) AND class_id = $2`,
    [studentIds, classId],
  );
  if (rows.length !== studentIds.length) {
    throw new HttpError(400, "One or more students are not enrolled in this class");
  }
}

export async function bulkInsertCompetencyRatings(input: RatingsBulkIn, teacherId: string) {
  const activity = await getAssessmentActivity(input.assessmentActivityId);

  if (activity.is_locked) {
    throw new HttpError(400, "This assessment activity is locked — ratings cannot be changed");
  }

  if (activity.teacher_id !== teacherId) {
    throw new HttpError(403, "Only the teacher who created this activity can enter ratings");
  }

  const studentIds = [...new Set(input.ratings.map((r) => r.studentId))];
  await assertStudentsInClass(studentIds, activity.class_id);

  let saved = 0;

  for (const item of input.ratings) {
    const { rowCount } = await query(
      `INSERT INTO competency_ratings (
        student_id, assessment_activity_id, competency_id, strand_id, competency_level
      ) VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (student_id, assessment_activity_id, competency_id) DO UPDATE SET
        competency_level = EXCLUDED.competency_level,
        strand_id = EXCLUDED.strand_id`,
      [
        item.studentId,
        input.assessmentActivityId,
        item.competencyId,
        item.strandId,
        item.competencyLevel,
      ],
    );
    if (rowCount && rowCount > 0) saved += 1;

    await dualWriteFromCompetencyRatingIds({
      studentId: item.studentId,
      competencyId: item.competencyId,
      strandId: item.strandId,
      competencyLevel: item.competencyLevel,
      subjectId: activity.subject_id,
      termId: activity.term_id,
      academicYearId: activity.academic_year_id,
      teacherId,
    });
  }

  return { saved: input.ratings.length, activityId: input.assessmentActivityId };
}

export async function lockAssessmentActivity(activityId: string, actorId: string) {
  const activity = await getAssessmentActivity(activityId);

  if (activity.is_locked) {
    throw new HttpError(400, "Activity is already locked");
  }

  if (activity.teacher_id !== actorId) {
    throw new HttpError(403, "Only the activity owner can lock this assessment");
  }

  const { rows } = await query<ActivityRow>(
    `UPDATE assessment_activities
     SET is_locked = true, locked_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [activityId],
  );
  return rows[0];
}

type SummaryRow = {
  id: string;
  student_id: string;
  subject_id: string;
  competency_id: string;
  term_id: string;
  aggregated_level: CompetencyLevel;
  aggregation_method: string;
  is_teacher_override: boolean;
  overridden_level: CompetencyLevel | null;
  override_justification: string | null;
  overridden_by: string | null;
  overridden_at: string | null;
  created_at: string;
  updated_at: string;
  competency_name: string;
  effective_level: CompetencyLevel;
};

export async function computeAndCacheTermSummaries(
  studentId: string,
  subjectId: string,
  termId: string,
): Promise<SummaryRow[]> {
  const { rows: competencyGroups } = await query<{ competency_id: string }>(
    `SELECT DISTINCT cr.competency_id
     FROM competency_ratings cr
     JOIN assessment_activities aa ON aa.id = cr.assessment_activity_id
     WHERE cr.student_id = $1
       AND aa.subject_id = $2
       AND aa.term_id = $3`,
    [studentId, subjectId, termId],
  );

  const summaries: SummaryRow[] = [];

  for (const { competency_id: competencyId } of competencyGroups) {
    const { rows: ratingRows } = await query<{ competency_level: CompetencyLevel }>(
      `SELECT cr.competency_level
       FROM competency_ratings cr
       JOIN assessment_activities aa ON aa.id = cr.assessment_activity_id
       WHERE cr.student_id = $1
         AND aa.subject_id = $2
         AND aa.term_id = $3
         AND cr.competency_id = $4`,
      [studentId, subjectId, termId, competencyId],
    );

    if (ratingRows.length === 0) continue;

    const { level, method } = aggregateTermCompetencyLevel(
      ratingRows.map((r) => r.competency_level),
    );

    const { rows } = await query<SummaryRow>(
      `INSERT INTO term_competency_summary (
        student_id, subject_id, competency_id, term_id,
        aggregated_level, aggregation_method, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,NOW())
      ON CONFLICT (student_id, subject_id, competency_id, term_id) DO UPDATE SET
        aggregated_level = EXCLUDED.aggregated_level,
        aggregation_method = EXCLUDED.aggregation_method,
        updated_at = NOW()
      RETURNING
        term_competency_summary.id,
        term_competency_summary.student_id,
        term_competency_summary.subject_id,
        term_competency_summary.competency_id,
        term_competency_summary.term_id,
        term_competency_summary.aggregated_level,
        term_competency_summary.aggregation_method,
        term_competency_summary.is_teacher_override,
        term_competency_summary.overridden_level,
        term_competency_summary.override_justification,
        term_competency_summary.overridden_by,
        term_competency_summary.overridden_at,
        term_competency_summary.created_at,
        term_competency_summary.updated_at`,
      [studentId, subjectId, competencyId, termId, level, method],
    );

    if (!rows[0]) continue;

    const { rows: enriched } = await query<SummaryRow>(
      `SELECT
        tcs.*,
        cc.name AS competency_name,
        CASE
          WHEN tcs.is_teacher_override AND tcs.overridden_level IS NOT NULL
          THEN tcs.overridden_level
          ELSE tcs.aggregated_level
        END AS effective_level
       FROM term_competency_summary tcs
       JOIN cbc_competencies cc ON cc.id = tcs.competency_id
       WHERE tcs.id = $1`,
      [rows[0].id],
    );

    if (enriched[0]) summaries.push(enriched[0]);
  }

  return summaries;
}

export async function overrideTermSummary(
  summaryId: string,
  overriddenLevel: CompetencyLevel,
  overrideJustification: string,
  headteacherId: string,
) {
  const { rows } = await query<SummaryRow>(
    `UPDATE term_competency_summary
     SET is_teacher_override = true,
         overridden_level = $2,
         override_justification = $3,
         overridden_by = $4,
         overridden_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING
       term_competency_summary.*,
       (SELECT name FROM cbc_competencies WHERE id = term_competency_summary.competency_id) AS competency_name,
       $2::competency_level AS effective_level`,
    [summaryId, overriddenLevel, overrideJustification, headteacherId],
  );

  if (!rows[0]) throw new HttpError(404, "Term competency summary not found");
  return rows[0];
}

export async function createLearningOutcome(input: LearningOutcomeIn, createdBy: string) {
  const { rows } = await query(
    `INSERT INTO learning_outcomes (subject_id, strand_id, term_id, description, created_by)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [input.subjectId, input.strandId, input.termId, input.description, createdBy],
  );
  return rows[0];
}

export async function createLearningOutcomeRecord(input: LearningOutcomeRecordIn) {
  const { rows: outcome } = await query<{ id: string }>(
    `SELECT id FROM learning_outcomes WHERE id = $1`,
    [input.learningOutcomeId],
  );
  if (!outcome[0]) throw new HttpError(404, "Learning outcome not found");

  const { rows: student } = await query<{ id: string }>(
    `SELECT id FROM students WHERE id = $1`,
    [input.studentId],
  );
  if (!student[0]) throw new HttpError(404, "Student not found");

  const { rows } = await query(
    `INSERT INTO learning_outcome_records (
      student_id, learning_outcome_id, achievement_level, remark
    ) VALUES ($1,$2,$3,$4)
    RETURNING *`,
    [input.studentId, input.learningOutcomeId, input.achievementLevel, input.remark ?? null],
  );
  return rows[0];
}
