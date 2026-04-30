import { query } from "../../config/db";

export async function dashboardKpis() {
  try {
    const [st, inv, cbc, al] = await Promise.all([
      query(`SELECT COUNT(*)::text AS c FROM students WHERE status = 'active'`),
      query(
        `SELECT COALESCE(SUM(amount_paid),0)::text AS paid, COALESCE(SUM(total_amount),0)::text AS due FROM fee_invoices`,
      ),
      query(
        `SELECT COALESCE(AVG(
            CASE rating WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 WHEN 'D' THEN 1 END
          ),0)::text AS avg_cbc
         FROM cbc_scores WHERE rating IS NOT NULL`,
      ),
      query(
        `SELECT COALESCE(AVG(score::numeric),0)::text AS avg_alevel FROM alevel_scores`,
      ),
    ]);
    return {
      activeStudents: st.rows[0]?.c ?? "0",
      totalFeesDue: (inv.rows[0] as { due?: string })?.due ?? "0",
      totalFeesPaid: (inv.rows[0] as { paid?: string })?.paid ?? "0",
      averageCbcNumeric: cbc.rows[0]?.avg_cbc ?? "0",
      averageAlevelScore: al.rows[0]?.avg_alevel ?? "0",
    };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not load dashboard");
  }
}

export async function classPerformance(classId: string, termId: string) {
  try {
    const cbc = await query(
      `SELECT sub.name, cs.rating, COUNT(*)::int AS cnt
       FROM cbc_scores cs
       JOIN students s ON s.id = cs.student_id
       JOIN subjects sub ON sub.id = cs.subject_id
       WHERE s.class_id = $1 AND cs.term_id = $2
       GROUP BY sub.name, cs.rating
       ORDER BY sub.name, cs.rating`,
      [classId, termId],
    );
    const al = await query(
      `SELECT sub.name, COALESCE(AVG(als.score::numeric),0)::text AS avg_score
       FROM alevel_scores als
       JOIN students s ON s.id = als.student_id
       JOIN subjects sub ON sub.id = als.subject_id
       WHERE s.class_id = $1 AND als.term_id = $2
       GROUP BY sub.name
       ORDER BY sub.name`,
      [classId, termId],
    );
    return { cbc: cbc.rows, alevel: al.rows };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Could not load class performance");
  }
}
