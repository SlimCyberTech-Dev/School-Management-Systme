import type pg from "pg";

export type StaffPurgeSummary = {
  classTeacherAssignments: number;
  teachableSubjects: number;
  classSubjectSlotsUnassigned: number;
  homeroomClassesCleared: number;
  assessmentsCbcRemoved: number;
  assessmentsAlevelRemoved: number;
  assessmentsCbcProjectRemoved: number;
  cbcScoresRemoved: number;
  alevelScoresRemoved: number;
  examMarksUnlinked: number;
  examSubmissionsUnlinked: number;
  commentLinksCleared: number;
  reportApprovalsCleared: number;
  sessionsRevoked: number;
};

async function exec(client: pg.PoolClient, text: string, params?: unknown[]): Promise<number> {
  const r = await client.query(text, params);
  return r.rowCount ?? 0;
}

/**
 * Removes teaching assignments and staff-linked records when a user is deleted.
 * Must run inside the caller's transaction.
 */
export async function purgeStaffAssociations(
  userId: string,
  client: pg.PoolClient,
): Promise<StaffPurgeSummary> {

  const summary: StaffPurgeSummary = {
    classTeacherAssignments: 0,
    teachableSubjects: 0,
    classSubjectSlotsUnassigned: 0,
    homeroomClassesCleared: 0,
    assessmentsCbcRemoved: 0,
    assessmentsAlevelRemoved: 0,
    assessmentsCbcProjectRemoved: 0,
    cbcScoresRemoved: 0,
    alevelScoresRemoved: 0,
    examMarksUnlinked: 0,
    examSubmissionsUnlinked: 0,
    commentLinksCleared: 0,
    reportApprovalsCleared: 0,
    sessionsRevoked: 0,
  };

  summary.classTeacherAssignments = await exec(
    client,
    `DELETE FROM class_teacher_assignments WHERE teacher_id = $1`,
    [userId],
  );

  summary.teachableSubjects = await exec(
    client,
    `DELETE FROM teacher_subject_specializations WHERE teacher_id = $1`,
    [userId],
  );

  summary.classSubjectSlotsUnassigned = await exec(
    client,
    `UPDATE class_subjects SET teacher_id = NULL, updated_at = NOW() WHERE teacher_id = $1`,
    [userId],
  );

  summary.homeroomClassesCleared = await exec(
    client,
    `UPDATE classes SET class_teacher_id = NULL WHERE class_teacher_id = $1`,
    [userId],
  );

  summary.assessmentsCbcRemoved = await exec(
    client,
    `DELETE FROM assessments_cbc WHERE teacher_id = $1`,
    [userId],
  );

  summary.assessmentsAlevelRemoved = await exec(
    client,
    `DELETE FROM assessments_alevel WHERE teacher_id = $1`,
    [userId],
  );

  summary.assessmentsCbcProjectRemoved = await exec(
    client,
    `DELETE FROM assessments_cbc_project WHERE teacher_id = $1`,
    [userId],
  );

  summary.cbcScoresRemoved = await exec(client, `DELETE FROM cbc_scores WHERE teacher_id = $1`, [userId]);

  summary.alevelScoresRemoved = await exec(client, `DELETE FROM alevel_scores WHERE teacher_id = $1`, [userId]);

  summary.examMarksUnlinked = await exec(
    client,
    `UPDATE exam_marks SET teacher_id = NULL, updated_at = NOW() WHERE teacher_id = $1`,
    [userId],
  );

  summary.examSubmissionsUnlinked = await exec(
    client,
    `UPDATE exam_subject_submissions SET submitted_by = NULL WHERE submitted_by = $1`,
    [userId],
  );

  summary.commentLinksCleared +=
    (await exec(client, `UPDATE assessment_comments SET class_teacher_id = NULL WHERE class_teacher_id = $1`, [
      userId,
    ])) +
    (await exec(client, `UPDATE assessment_comments SET headteacher_id = NULL WHERE headteacher_id = $1`, [userId])) +
    (await exec(
      client,
      `UPDATE assessment_alevel_comments SET class_teacher_id = NULL WHERE class_teacher_id = $1`,
      [userId],
    )) +
    (await exec(
      client,
      `UPDATE assessment_alevel_comments SET headteacher_id = NULL WHERE headteacher_id = $1`,
      [userId],
    ));

  summary.reportApprovalsCleared +=
    (await exec(
      client,
      `UPDATE cbc_report_cards SET approved_by = NULL, approved_at = NULL WHERE approved_by = $1`,
      [userId],
    )) +
    (await exec(
      client,
      `UPDATE alevel_results SET approved_by = NULL, approved_at = NULL WHERE approved_by = $1`,
      [userId],
    ));

  await exec(client, `UPDATE attendance SET recorded_by = NULL WHERE recorded_by = $1`, [userId]);
  await exec(client, `UPDATE fee_payments SET recorded_by = NULL WHERE recorded_by = $1`, [userId]);
  await exec(client, `UPDATE exams SET created_by = NULL WHERE created_by = $1`, [userId]);
  await exec(client, `UPDATE exams SET deleted_by = NULL WHERE deleted_by = $1`, [userId]);

  summary.sessionsRevoked = await exec(client, `DELETE FROM auth_sessions WHERE user_id = $1`, [userId]);
  await exec(client, `DELETE FROM password_reset_codes WHERE user_id = $1`, [userId]);
  await exec(client, `DELETE FROM email_verification_codes WHERE user_id = $1`, [userId]);

  return summary;
}
