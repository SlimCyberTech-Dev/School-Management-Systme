import type { PoolClient } from "pg";
import { HttpError } from "../../utils/httpError";

type RegisterStatus = "draft" | "submitted" | "locked";

function assertRegisterEditable(status: RegisterStatus, context: "homeroom" | "lesson"): void {
  if (status === "locked" || status === "submitted") {
    throw new HttpError(
      400,
      context === "lesson"
        ? "This lesson's attendance was already submitted and cannot be changed."
        : "This class attendance register was already submitted and cannot be changed.",
    );
  }
}

export async function ensureHomeroomRegisterDraft(
  client: PoolClient,
  classId: string,
  date: string,
  recordedBy: string,
): Promise<string> {
  const existing = await client.query<{ id: string; status: RegisterStatus }>(
    `SELECT id, status
     FROM attendance_registers
     WHERE class_id = $1
       AND date = $2
       AND register_type = 'homeroom'
     LIMIT 1`,
    [classId, date],
  );

  const row = existing.rows[0];
  if (row) {
    assertRegisterEditable(row.status, "homeroom");
    await client.query(
      `UPDATE attendance_registers
       SET recorded_by = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [row.id, recordedBy],
    );
    return row.id;
  }

  const inserted = await client.query<{ id: string }>(
    `INSERT INTO attendance_registers (class_id, date, register_type, status, recorded_by, updated_at)
     VALUES ($1, $2, 'homeroom', 'draft', $3, NOW())
     RETURNING id`,
    [classId, date, recordedBy],
  );
  return inserted.rows[0]!.id;
}

export async function ensureLessonRegisterDraft(
  client: PoolClient,
  params: {
    classId: string;
    date: string;
    timetableEntryId: string;
    periodId: string;
    classSubjectId: string;
    recordedBy: string;
  },
): Promise<string> {
  const existing = await client.query<{ id: string; status: RegisterStatus }>(
    `SELECT id, status
     FROM attendance_registers
     WHERE timetable_entry_id = $1
       AND date = $2
       AND register_type = 'lesson'
     LIMIT 1`,
    [params.timetableEntryId, params.date],
  );

  const row = existing.rows[0];
  if (row) {
    assertRegisterEditable(row.status, "lesson");
    await client.query(
      `UPDATE attendance_registers
       SET recorded_by = $2,
           period_id = $3,
           class_subject_id = $4,
           updated_at = NOW()
       WHERE id = $1`,
      [row.id, params.recordedBy, params.periodId, params.classSubjectId],
    );
    return row.id;
  }

  const inserted = await client.query<{ id: string }>(
    `INSERT INTO attendance_registers (
       class_id, date, register_type, timetable_entry_id, period_id, class_subject_id,
       status, recorded_by, updated_at
     )
     VALUES ($1, $2, 'lesson', $3, $4, $5, 'draft', $6, NOW())
     RETURNING id`,
    [
      params.classId,
      params.date,
      params.timetableEntryId,
      params.periodId,
      params.classSubjectId,
      params.recordedBy,
    ],
  );
  return inserted.rows[0]!.id;
}

/** Replaces all marks for a register (avoids partial unique-index ON CONFLICT). */
export async function replaceRegisterMarks(
  client: PoolClient,
  registerId: string,
  classId: string,
  date: string,
  recordedBy: string,
  studentIds: string[],
  statuses: string[],
): Promise<void> {
  await client.query(`DELETE FROM attendance WHERE register_id = $1`, [registerId]);
  if (studentIds.length === 0) return;

  await client.query(
    `INSERT INTO attendance (student_id, class_id, date, status, recorded_by, register_id, updated_at)
     SELECT x.student_id, $1, $2, x.status, $3, $4, NOW()
     FROM unnest($5::uuid[], $6::text[]) AS x(student_id, status)`,
    [classId, date, recordedBy, registerId, studentIds, statuses],
  );
}
