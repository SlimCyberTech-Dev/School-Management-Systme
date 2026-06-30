import { query } from "../config/db";
import { HttpError } from "./httpError";

export async function validateActiveClassStudents(
  classId: string,
  studentIds: string[],
): Promise<void> {
  if (studentIds.length === 0) return;

  const uniqueIds = [...new Set(studentIds)];
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM students
     WHERE class_id = $1 AND status = 'active' AND id = ANY($2::uuid[])`,
    [classId, uniqueIds],
  );

  if (rows.length !== uniqueIds.length) {
    throw new HttpError(
      400,
      "One or more students are not active in this class. Refresh the roster and try again.",
    );
  }
}
