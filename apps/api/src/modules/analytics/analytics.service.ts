import { query } from "../../config/db";

export type DashboardRecentStudent = {
  id: string;
  studentNumber: string;
  fullName: string;
  enrolledAt: string;
};

export type DashboardKpisResult = {
  activeStudents: string;
  totalFeesDue: string;
  totalFeesPaid: string;
  averageCbcNumeric: string;
  averageAlevelScore: string;
  teacherCount: number;
  recentStudents: DashboardRecentStudent[];
};

export async function dashboardKpis(_tenantId: string): Promise<DashboardKpisResult> {
  try {
    const [st, inv, cbc, al, teachers, recent] = await Promise.all([
      query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM students WHERE status = 'active'`,
      ),
      query<{ paid: string; due: string }>(
        `SELECT COALESCE(SUM(amount_paid),0)::text AS paid, COALESCE(SUM(total_amount),0)::text AS due
         FROM fee_invoices`,
      ),
      query<{ avg_cbc: string }>(
        `SELECT COALESCE(AVG(
            CASE rating WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 WHEN 'D' THEN 1 END
          ),0)::text AS avg_cbc
         FROM cbc_scores WHERE rating IS NOT NULL`,
      ),
      query<{ avg_alevel: string }>(
        `SELECT COALESCE(AVG(score::numeric),0)::text AS avg_alevel FROM alevel_scores`,
      ),
      query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM users
         WHERE deleted_at IS NULL AND is_active = true
           AND role IN ('class_teacher', 'subject_teacher', 'headteacher')`,
      ),
      query<{
        id: string;
        student_number: string;
        full_name: string;
        enrolled_at: Date | null;
        created_at: Date;
      }>(
        `SELECT id, student_number, full_name, enrolled_at, created_at
         FROM students
         WHERE status = 'active'
         ORDER BY COALESCE(enrolled_at, created_at) DESC
         LIMIT 8`,
      ),
    ]);

    return {
      activeStudents: st.rows[0]?.c ?? "0",
      totalFeesDue: inv.rows[0]?.due ?? "0",
      totalFeesPaid: inv.rows[0]?.paid ?? "0",
      averageCbcNumeric: cbc.rows[0]?.avg_cbc ?? "0",
      averageAlevelScore: al.rows[0]?.avg_alevel ?? "0",
      teacherCount: Number(teachers.rows[0]?.c ?? "0"),
      recentStudents: recent.rows.map((r) => ({
        id: r.id,
        studentNumber: r.student_number,
        fullName: r.full_name,
        enrolledAt: r.enrolled_at
          ? new Date(r.enrolled_at).toISOString()
          : new Date(r.created_at).toISOString(),
      })),
    };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not load dashboard");
  }
}

export async function classPerformance(classId: string, termId: string, tenantId: string) {
  try {
    const cbc = await query(
      `SELECT sub.name, cs.rating, COUNT(*)::int AS cnt
       FROM cbc_scores cs
       JOIN students s ON s.id = cs.student_id AND s.tenant_id = $3
       JOIN subjects sub ON sub.id = cs.subject_id AND sub.tenant_id = $3
       WHERE s.class_id = $1 AND cs.term_id = $2 AND cs.tenant_id = $3
       GROUP BY sub.name, cs.rating
       ORDER BY sub.name, cs.rating`,
      [classId, termId, tenantId],
    );
    const al = await query(
      `SELECT sub.name, COALESCE(AVG(als.score::numeric),0)::text AS avg_score
       FROM alevel_scores als
       JOIN students s ON s.id = als.student_id AND s.tenant_id = $3
       JOIN subjects sub ON sub.id = als.subject_id AND sub.tenant_id = $3
       WHERE s.class_id = $1 AND als.term_id = $2 AND als.tenant_id = $3
       GROUP BY sub.name
       ORDER BY sub.name`,
      [classId, termId, tenantId],
    );
    return { cbc: cbc.rows, alevel: al.rows };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not load class performance");
  }
}

type ReportTrackStats = {
  generated: number;
  approved: number;
  pendingApproval: number;
  notGenerated: number;
};

export async function reportPipeline(classId: string, termId: string, tenantId: string) {
  try {
    const active = await query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM students
       WHERE class_id = $1 AND status = 'active' AND tenant_id = $2`,
      [classId, tenantId],
    );
    const activeStudents = active.rows[0]?.c ?? 0;

    const cbc = await query<{ generated: number; approved: number }>(
      `SELECT
         COUNT(*)::int AS generated,
         COUNT(*) FILTER (WHERE cr.is_approved)::int AS approved
       FROM cbc_report_cards cr
       JOIN students s ON s.id = cr.student_id AND s.tenant_id = $3
       WHERE s.class_id = $1 AND cr.term_id = $2 AND cr.tenant_id = $3`,
      [classId, termId, tenantId],
    );
    const al = await query<{ generated: number; approved: number }>(
      `SELECT
         COUNT(*)::int AS generated,
         COUNT(*) FILTER (WHERE ar.is_approved)::int AS approved
       FROM alevel_results ar
       JOIN students s ON s.id = ar.student_id AND s.tenant_id = $3
       WHERE s.class_id = $1 AND ar.term_id = $2 AND ar.tenant_id = $3`,
      [classId, termId, tenantId],
    );

    const cbcRow = cbc.rows[0] ?? { generated: 0, approved: 0 };
    const alRow = al.rows[0] ?? { generated: 0, approved: 0 };

    const toTrack = (row: { generated: number; approved: number }): ReportTrackStats => {
      const generated = row.generated;
      const approved = row.approved;
      const pendingApproval = Math.max(0, generated - approved);
      const notGenerated = Math.max(0, activeStudents - generated);
      return { generated, approved, pendingApproval, notGenerated };
    };

    const timeline = await query<{ day: string; track: string; cnt: number }>(
      `SELECT DATE(approved_at)::text AS day, 'cbc' AS track, COUNT(*)::int AS cnt
       FROM cbc_report_cards cr
       JOIN students s ON s.id = cr.student_id AND s.tenant_id = $3
       WHERE s.class_id = $1 AND cr.term_id = $2 AND cr.is_approved AND cr.approved_at IS NOT NULL
         AND cr.tenant_id = $3
       GROUP BY DATE(approved_at)
       UNION ALL
       SELECT DATE(approved_at)::text AS day, 'alevel' AS track, COUNT(*)::int AS cnt
       FROM alevel_results ar
       JOIN students s ON s.id = ar.student_id AND s.tenant_id = $3
       WHERE s.class_id = $1 AND ar.term_id = $2 AND ar.is_approved AND ar.approved_at IS NOT NULL
         AND ar.tenant_id = $3
       GROUP BY DATE(approved_at)
       ORDER BY day`,
      [classId, termId, tenantId],
    );

    return {
      activeStudents,
      cbc: toTrack(cbcRow),
      alevel: toTrack(alRow),
      approvalTimeline: timeline.rows,
    };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not load report pipeline");
  }
}

export async function alevelDivisions(classId: string, termId: string, tenantId: string) {
  try {
    const { rows } = await query<{ division: string; cnt: number }>(
      `SELECT COALESCE(ar.division, 'Unassigned') AS division, COUNT(*)::int AS cnt
       FROM alevel_results ar
       JOIN students s ON s.id = ar.student_id AND s.tenant_id = $3
       WHERE s.class_id = $1 AND ar.term_id = $2 AND ar.tenant_id = $3
       GROUP BY ar.division
       ORDER BY cnt DESC`,
      [classId, termId, tenantId],
    );
    return rows;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not load A-Level divisions");
  }
}

export async function assessmentReadiness(classId: string, termId: string, yearId: string, tenantId: string) {
  try {
    const [olevel, alevel] = await Promise.all([
      query<{ subject_id: string; subject_name: string; subject_code: string; teacher_name: string | null; status: string }>(
        `SELECT
          s.id AS subject_id,
          s.name AS subject_name,
          s.code AS subject_code,
          u.full_name AS teacher_name,
          CASE
            WHEN (
              SELECT COUNT(*)::int
              FROM exams e
              JOIN exam_subjects es ON es.exam_id = e.id AND es.subject_id = cs.subject_id
              WHERE e.class_id = $1 AND e.term_id = $2 AND e.tenant_id = $4
            ) = 0 THEN 'Draft'
            WHEN (
              SELECT COUNT(*)::int
              FROM exams e
              JOIN exam_subjects es ON es.exam_id = e.id AND es.subject_id = cs.subject_id
              JOIN exam_subject_submissions ess
                ON ess.exam_id = e.id AND ess.subject_id = cs.subject_id AND ess.is_submitted = true
              WHERE e.class_id = $1 AND e.term_id = $2 AND e.tenant_id = $4
            ) = (
              SELECT COUNT(*)::int
              FROM exams e
              JOIN exam_subjects es ON es.exam_id = e.id AND es.subject_id = cs.subject_id
              WHERE e.class_id = $1 AND e.term_id = $2 AND e.tenant_id = $4
            ) THEN 'Submitted'
            ELSE 'Draft'
          END AS status
         FROM class_subjects cs
         JOIN subjects s ON s.id = cs.subject_id AND s.tenant_id = $4
         LEFT JOIN users u ON u.id = cs.teacher_id AND u.tenant_id = $4
         WHERE cs.class_id = $1 AND cs.academic_year_id = $3 AND cs.tenant_id = $4
         GROUP BY s.id, s.name, s.code, u.full_name, cs.subject_id
         ORDER BY s.code`,
        [classId, termId, yearId, tenantId],
      ),
      query<{ subject_id: string; subject_name: string; subject_code: string; teacher_name: string | null; status: string }>(
        `SELECT
          s.id AS subject_id,
          s.name AS subject_name,
          s.code AS subject_code,
          u.full_name AS teacher_name,
          CASE
            WHEN COUNT(aa.id) = 0 THEN 'Draft'
            WHEN BOOL_AND(aa.is_submitted) THEN 'Submitted'
            ELSE 'Draft'
          END AS status
         FROM class_subjects cs
         JOIN subjects s ON s.id = cs.subject_id AND s.tenant_id = $4
         LEFT JOIN users u ON u.id = cs.teacher_id AND u.tenant_id = $4
         LEFT JOIN students st ON st.class_id = cs.class_id AND st.tenant_id = $4
         LEFT JOIN assessments_alevel aa
           ON aa.student_id = st.id
          AND aa.subject_id = cs.subject_id
          AND aa.term_id = $2
          AND aa.academic_year_id = $3
          AND aa.tenant_id = $4
         WHERE cs.class_id = $1 AND cs.academic_year_id = $3 AND cs.tenant_id = $4
         GROUP BY s.id, s.name, s.code, u.full_name
         ORDER BY s.code`,
        [classId, termId, yearId, tenantId],
      ),
    ]);
    return { cbc: olevel.rows, alevel: alevel.rows };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not load assessment readiness");
  }
}

export async function reportsOverview(
  classId: string,
  termId: string,
  yearId: string,
  tenantId: string,
) {
  const [pipeline, performance, readiness, divisions, kpis] = await Promise.all([
    reportPipeline(classId, termId, tenantId),
    classPerformance(classId, termId, tenantId),
    assessmentReadiness(classId, termId, yearId, tenantId),
    alevelDivisions(classId, termId, tenantId),
    dashboardKpis(tenantId),
  ]);
  return { pipeline, performance, readiness, divisions, kpis };
}
